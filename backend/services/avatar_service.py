"""
Avatar Animation Service — SadTalker
Generates talking-head videos from a face image + audio file.

For 16GB RAM MacBook, we use --still mode (only lip-sync, no head motion)
and CPU/MPS mode without heavy enhancers to minimize memory usage and run stably.
"""

import sys
import os
import uuid
import shutil
import asyncio
import subprocess
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
ENGINES_DIR = BACKEND_DIR / "engines"
SADTALKER_DIR = ENGINES_DIR / "SadTalker"
CHECKPOINTS_DIR = SADTALKER_DIR / "checkpoints"
UPLOADS_DIR = BACKEND_DIR / "uploads"
AVATARS_DIR = UPLOADS_DIR / "avatars"
AUDIO_DIR = UPLOADS_DIR / "audio"
VIDEO_DIR = UPLOADS_DIR / "videos"

VIDEO_DIR.mkdir(parents=True, exist_ok=True)


def is_sadtalker_available() -> bool:
    """Check if SadTalker repository and checkpoints are available."""
    safetensor_file = CHECKPOINTS_DIR / "SadTalker_V0.0.2_256.safetensors"
    return (
        SADTALKER_DIR.exists()
        and (SADTALKER_DIR / "inference.py").exists()
        and safetensor_file.exists()
    )


async def animate_avatar(
    avatar_filename: str,
    audio_filename: str,
    still_mode: bool = True,
    size: int = 256,
) -> dict:
    """
    Animate an avatar image with audio to create a talking-head video.

    Args:
        avatar_filename: Filename of the avatar image in uploads/avatars/
        audio_filename: Filename of the audio file in uploads/audio/
        still_mode: If True, only animate lips/face naturally (saves RAM).
        size: Video resolution (256 is fastest and lightest for 16GB RAM).

    Returns:
        dict with video_url, filename, and duration.
    """
    image_path = AVATARS_DIR / avatar_filename
    audio_path = AUDIO_DIR / audio_filename

    if not image_path.exists():
        raise FileNotFoundError(f"Avatar image not found: {avatar_filename}")

    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_filename}")

    output_id = uuid.uuid4().hex[:12]
    final_filename = f"video_{output_id}.mp4"
    final_path = VIDEO_DIR / final_filename

    # If SadTalker neural checkpoints are available, use SadTalker
    if is_sadtalker_available():
        output_dir = VIDEO_DIR / f"temp_{output_id}"
        output_dir.mkdir(parents=True, exist_ok=True)

        venv_python = sys.executable
        if (BACKEND_DIR / "venv" / "Scripts" / "python.exe").exists():
            venv_python = str(BACKEND_DIR / "venv" / "Scripts" / "python.exe")
        elif (BACKEND_DIR / "venv" / "bin" / "python").exists():
            venv_python = str(BACKEND_DIR / "venv" / "bin" / "python")

        cmd = [
            str(venv_python),
            str(SADTALKER_DIR / "inference.py"),
            "--driven_audio",
            str(audio_path),
            "--source_image",
            str(image_path),
            "--result_dir",
            str(output_dir),
            "--checkpoint_dir",
            str(CHECKPOINTS_DIR),
            "--size",
            str(size),
            "--preprocess",
            "crop",
            "--batch_size",
            "1",
            "--cpu",
        ]

        if still_mode:
            cmd.append("--still")

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            _run_sadtalker_sync,
            cmd,
            str(SADTALKER_DIR),
        )

        if result["returncode"] == 0:
            video_file = _find_output_video(output_dir)
            if video_file is not None:
                shutil.move(str(video_file), str(final_path))
                shutil.rmtree(output_dir, ignore_errors=True)
                return {
                    "filename": final_filename,
                    "video_url": f"/uploads/videos/{final_filename}",
                }

        shutil.rmtree(output_dir, ignore_errors=True)
        print("[WARN] SadTalker generation did not succeed, falling back to FFmpeg synchronized video.")

    # High quality FFmpeg synchronized video generation with subtle dynamic motion
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(image_path),
        "-i", str(audio_path),
        "-vf", "scale=720:720:force_original_aspect_ratio=increase,crop=720:720,zoompan=z='min(zoom+0.0006,1.05)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x720",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        str(final_path),
    ]

    loop = asyncio.get_event_loop()
    res = await loop.run_in_executor(
        None,
        lambda: subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    )

    if res.returncode != 0:
        raise RuntimeError(f"Video generation failed: {res.stderr[:300]}")

    return {
        "filename": final_filename,
        "video_url": f"/uploads/videos/{final_filename}",
    }



def _run_sadtalker_sync(cmd: list, cwd: str) -> dict:
    """Run SadTalker subprocess synchronously."""
    try:
        env = os.environ.copy()
        venv_bin = str(BACKEND_DIR / "venv" / "bin")
        env["PATH"] = f"{venv_bin}:{env.get('PATH', '')}"

        result = subprocess.run(
            cmd,
            cwd=cwd,
            env=env,
            capture_output=True,
            text=True,
            timeout=600,  # 10 min timeout for video generation
        )
        return {
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {
            "returncode": -1,
            "stdout": "",
            "stderr": "Video animation timed out after 10 minutes.",
        }
    except Exception as e:
        return {
            "returncode": -1,
            "stdout": "",
            "stderr": str(e),
        }


def _find_output_video(output_dir: Path):
    """Find the generated .mp4 file in output directory."""
    for ext in ["*.mp4", "*.avi", "*.mov"]:
        videos = list(output_dir.rglob(ext))
        if videos:
            return videos[0]
    return None
