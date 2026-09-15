from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pathlib import Path
from typing import Optional
import os

from services.tts_service import (
    generate_speech,
    get_available_voices,
    VOICE_MAP,
)
from services.avatar_service import (
    animate_avatar,
    is_sadtalker_available,
)
from services.script_service import generate_script

app = FastAPI(title="AvatarAI Backend", version="2.0.0")

# --------------------------------------------------
# CORS
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Upload Directories
# --------------------------------------------------
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
AVATAR_DIR = UPLOAD_DIR / "avatars"
AUDIO_DIR = UPLOAD_DIR / "audio"
VIDEO_DIR = UPLOAD_DIR / "videos"

for directory in [AVATAR_DIR, AUDIO_DIR, VIDEO_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------
# Serve Uploaded Files
# --------------------------------------------------
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads",
)


# --------------------------------------------------
# Pydantic Request Models
# --------------------------------------------------
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice: str = Field(default="Sofia")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class AnimateRequest(BaseModel):
    avatar_filename: str
    audio_filename: str
    still_mode: bool = True
    size: int = 256


class VideoGenerateRequest(BaseModel):
    avatar: str
    script: str = Field(..., min_length=1)
    voice: str = Field(default="Sofia")
    speed: float = Field(default=1.0)
    still_mode: bool = True


class ScriptRequest(BaseModel):
    prompt: Optional[str] = ""
    category: Optional[str] = "welcome"
    tone: Optional[str] = "professional"


# --------------------------------------------------
# Health & Status
# --------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "AvatarAI backend is running with local AI models",
        "version": "2.0.0",
        "sadtalker_ready": is_sadtalker_available(),
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "sadtalker_ready": is_sadtalker_available(),
    }


# --------------------------------------------------
# Avatars CRUD
# --------------------------------------------------
@app.post("/avatars")
async def upload_avatar(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_path = AVATAR_DIR / file.filename
    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    return {
        "message": "Avatar uploaded successfully",
        "filename": file.filename,
        "url": f"http://127.0.0.1:8000/uploads/avatars/{file.filename}",
    }


@app.get("/avatars")
def get_avatars():
    avatars = []
    if AVATAR_DIR.exists():
        for file_path in sorted(AVATAR_DIR.iterdir()):
            if file_path.is_file() and not file_path.name.startswith("."):
                avatars.append(
                    {
                        "filename": file_path.name,
                        "url": f"http://127.0.0.1:8000/uploads/avatars/{file_path.name}",
                    }
                )

    return {"avatars": avatars}


@app.delete("/avatars/{filename}")
def delete_avatar(filename: str):
    file_path = AVATAR_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")

    file_path.unlink()
    return {"message": "Avatar deleted successfully", "filename": filename}


# --------------------------------------------------
# Voices & Text-to-Speech
# --------------------------------------------------
@app.get("/api/voices")
def list_voices():
    """List all available TTS voices."""
    return {"voices": get_available_voices()}


@app.post("/api/tts")
async def create_speech(req: TTSRequest):
    """Generate audio from text using local Kokoro TTS."""
    try:
        result = await generate_speech(
            text=req.text,
            voice=req.voice,
            speed=req.speed,
        )
        return {
            "success": True,
            "filename": result["filename"],
            "audio_url": f"http://127.0.0.1:8000{result['audio_url']}",
            "duration_seconds": result["duration_seconds"],
            "voice": result["voice"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")


# --------------------------------------------------
# Avatar Animation & Video Generation
# --------------------------------------------------
@app.post("/api/animate")
async def create_animation(req: AnimateRequest):
    """Animate an avatar photo with audio using SadTalker."""
    try:
        result = await animate_avatar(
            avatar_filename=req.avatar_filename,
            audio_filename=req.audio_filename,
            still_mode=req.still_mode,
            size=req.size,
        )
        return {
            "success": True,
            "filename": result["filename"],
            "video_url": f"http://127.0.0.1:8000{result['video_url']}",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Animation error: {str(e)}"
        )


@app.post("/api/generate-video")
async def generate_full_video(req: VideoGenerateRequest):
    """
    End-to-end video pipeline:
    1. Generate speech audio from script + voice
    2. Animate avatar face with generated audio
    3. Return complete video URL
    """
    try:
        # Step 1: TTS
        tts_result = await generate_speech(
            text=req.script,
            voice=req.voice,
            speed=req.speed,
        )
        audio_filename = tts_result["filename"]

        # Step 2: Animate Avatar
        anim_result = await animate_avatar(
            avatar_filename=req.avatar,
            audio_filename=audio_filename,
            still_mode=req.still_mode,
        )

        return {
            "success": True,
            "video_url": f"http://127.0.0.1:8000{anim_result['video_url']}",
            "audio_url": f"http://127.0.0.1:8000{tts_result['audio_url']}",
            "video_filename": anim_result["filename"],
            "audio_filename": audio_filename,
            "duration_seconds": tts_result["duration_seconds"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Video generation pipeline error: {str(e)}"
        )


# --------------------------------------------------
# AI Script Writing
# --------------------------------------------------
@app.post("/api/generate-script")
def create_script(req: ScriptRequest):
    """Generate an engaging video script using AI templates."""
    result = generate_script(
        prompt=req.prompt or "",
        category=req.category or "welcome",
        tone=req.tone or "professional",
    )
    return {"success": True, **result}


# --------------------------------------------------
# Projects / Video Management
# --------------------------------------------------
@app.get("/api/projects")
def list_projects():
    """List all generated videos."""
    projects = []
    if VIDEO_DIR.exists():
        for file_path in sorted(
            VIDEO_DIR.iterdir(), key=os.path.getmtime, reverse=True
        ):
            if file_path.is_file() and file_path.suffix.lower() in [
                ".mp4",
                ".mov",
                ".avi",
            ]:
                projects.append(
                    {
                        "filename": file_path.name,
                        "url": f"http://127.0.0.1:8000/uploads/videos/{file_path.name}",
                        "size_mb": round(
                            file_path.stat().st_size / (1024 * 1024), 2
                        ),
                    }
                )
    return {"projects": projects}


@app.delete("/api/projects/{filename}")
def delete_project(filename: str):
    file_path = VIDEO_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Project video not found")

    file_path.unlink()
    return {"message": "Project deleted successfully", "filename": filename}