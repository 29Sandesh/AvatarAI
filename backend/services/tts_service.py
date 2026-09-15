"""
TTS Service — Kokoro ONNX (82M parameter model)
Provides text-to-speech generation with 3 voice options.
"""

import os
import uuid
import asyncio
from pathlib import Path

# Will be imported after model download
kokoro_instance = None
MODELS_DIR = Path(__file__).parent.parent / "models"
AUDIO_DIR = Path(__file__).parent.parent / "uploads" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# Edge-TTS Neural Voices (Ultra-realistic, studio grade, human sounding)
EDGE_VOICES = {
    "Guy": "en-US-GuyNeural",
    "Jenny": "en-US-JennyNeural",
    "Prabhat": "en-IN-PrabhatNeural",
    "Neerja": "en-IN-NeerjaNeural",
}

# Map frontend voice names → Kokoro voice IDs
VOICE_MAP = {
    "Guy": "en-US-GuyNeural",
    "Jenny": "en-US-JennyNeural",
    "Prabhat": "en-IN-PrabhatNeural",
    "Neerja": "en-IN-NeerjaNeural",
    "Sofia": "af_heart",    # Female, warm
    "James": "am_adam",      # Male, deep
    "Emma": "af_bella",      # Female, clear
}

VOICE_INFO = {
    "Guy": {
        "id": "en-US-GuyNeural",
        "description": "Natural, deep and conversational male voice (Ultra-Realistic)",
        "language": "English (US)",
        "style": "Conversational",
    },
    "Jenny": {
        "id": "en-US-JennyNeural",
        "description": "Clear, friendly studio female voice (Ultra-Realistic)",
        "language": "English (US)",
        "style": "Natural",
    },
    "Prabhat": {
        "id": "en-IN-PrabhatNeural",
        "description": "Natural Indian-English male voice",
        "language": "English (India)",
        "style": "Natural",
    },
    "Neerja": {
        "id": "en-IN-NeerjaNeural",
        "description": "Expressive Indian-English female voice",
        "language": "English (India)",
        "style": "Expressive",
    },
    "Sofia": {
        "id": "af_heart",
        "description": "Warm female voice (Local ONNX)",
        "language": "English",
        "style": "Warm",
    },
    "James": {
        "id": "am_adam",
        "description": "Deep male voice (Local ONNX)",
        "language": "English",
        "style": "Deep",
    },
    "Emma": {
        "id": "af_bella",
        "description": "Clear female voice (Local ONNX)",
        "language": "English",
        "style": "Clear",
    },
}


def _get_kokoro():
    """Lazy-load the Kokoro model (only once)."""
    global kokoro_instance

    if kokoro_instance is not None:
        return kokoro_instance

    try:
        from kokoro_onnx import Kokoro

        model_path = MODELS_DIR / "kokoro-v1.0.onnx"
        voices_path = MODELS_DIR / "voices-v1.0.bin"

        if not model_path.exists() or not voices_path.exists():
            raise FileNotFoundError(
                f"Kokoro model files not found in {MODELS_DIR}. "
                "Run the download script first."
            )

        kokoro_instance = Kokoro(
            str(model_path),
            str(voices_path),
        )
        print("[OK] Kokoro TTS model loaded successfully")
        return kokoro_instance

    except Exception as e:
        print(f"[ERROR] Failed to load Kokoro TTS: {e}")
        raise


async def generate_speech(
    text: str,
    voice: str = "Guy",
    speed: float = 1.0,
) -> dict:
    """
    Generate speech audio from text. Supports Edge-TTS studio neural voices
    as well as local Kokoro ONNX voices.
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    filename = f"{uuid.uuid4().hex[:12]}.wav"
    file_path = AUDIO_DIR / filename

    # 1. Edge-TTS Studio Neural Voices (Guy, Jenny, Prabhat, Neerja)
    if voice in EDGE_VOICES:
        import edge_tts
        import soundfile as sf
        import subprocess

        voice_id = EDGE_VOICES[voice]
        temp_mp3 = file_path.with_suffix(".mp3")

        rate_str = f"+{int((speed - 1.0) * 100)}%" if speed >= 1.0 else f"-{int((1.0 - speed) * 100)}%"
        comm = edge_tts.Communicate(text.strip(), voice_id, rate=rate_str)
        await comm.save(str(temp_mp3))

        cmd = ["ffmpeg", "-y", "-i", str(temp_mp3), "-ar", "24000", "-ac", "1", str(file_path)]
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: subprocess.run(cmd, capture_output=True))
        if temp_mp3.exists():
            try:
                temp_mp3.unlink()
            except Exception:
                pass

        info = sf.info(str(file_path))
        return {
            "filename": filename,
            "audio_url": f"/uploads/audio/{filename}",
            "duration_seconds": round(info.duration, 2),
            "voice": voice,
        }

    # 2. Local Kokoro ONNX voices
    voice_id = VOICE_MAP.get(voice, "af_heart")
    loop = asyncio.get_event_loop()
    samples, sample_rate = await loop.run_in_executor(
        None,
        _generate_audio_sync,
        text.strip(),
        voice_id,
        speed,
    )

    import soundfile as sf
    sf.write(str(file_path), samples, sample_rate)

    return {
        "filename": filename,
        "audio_url": f"/uploads/audio/{filename}",
        "duration_seconds": round(len(samples) / sample_rate, 2),
        "voice": voice,
    }


def _generate_audio_sync(
    text: str,
    voice_id: str,
    speed: float,
):
    """Synchronous audio generation (runs in thread)."""
    kokoro = _get_kokoro()
    samples, sample_rate = kokoro.create(
        text,
        voice=voice_id,
        speed=speed,
    )
    return samples, sample_rate


def get_available_voices() -> list:
    """Return list of available voices."""
    return [
        {
            "name": name,
            "voice_id": info["id"],
            "description": info["description"],
            "language": info["language"],
            "style": info["style"],
        }
        for name, info in VOICE_INFO.items()
    ]
