"""
Automated Model Downloader for AvatarAI / SadTalker
Downloads all required weights for Kokoro TTS, SadTalker, and FaceXLib.
Works on macOS (Apple Silicon / Intel), Linux, and Windows.
"""

import os
import sys
import shutil
import zipfile
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
SADTALKER_DIR = BASE_DIR / "engines" / "SadTalker"
CHECKPOINTS_DIR = SADTALKER_DIR / "checkpoints"
GFPGAN_DIR = SADTALKER_DIR / "gfpgan" / "weights"
CONFIG_BFM_DIR = SADTALKER_DIR / "src" / "config" / "BFM_Fitting"

DOWNLOADS = [
    # Kokoro ONNX
    {
        "url": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
        "target": MODELS_DIR / "kokoro-v1.0.onnx",
        "desc": "Kokoro ONNX Model (82M)",
    },
    {
        "url": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
        "target": MODELS_DIR / "voices-v1.0.bin",
        "desc": "Kokoro Voices Database",
    },
    # SadTalker Checkpoints
    {
        "url": "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors",
        "target": CHECKPOINTS_DIR / "SadTalker_V0.0.2_256.safetensors",
        "desc": "SadTalker 256px SafeTensors",
    },
    {
        "url": "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar",
        "target": CHECKPOINTS_DIR / "mapping_00109-model.pth.tar",
        "desc": "SadTalker Mapping 109",
    },
    {
        "url": "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar",
        "target": CHECKPOINTS_DIR / "mapping_00229-model.pth.tar",
        "desc": "SadTalker Mapping 229",
    },
    # FaceXLib & Landmark Weights
    {
        "url": "https://github.com/xinntao/facexlib/releases/download/v0.1.0/alignment_WFLW_4HG.pth",
        "target": GFPGAN_DIR / "alignment_WFLW_4HG.pth",
        "desc": "FaceXLib WFLW Alignment",
    },
    {
        "url": "https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth",
        "target": GFPGAN_DIR / "detection_Resnet50_Final.pth",
        "desc": "FaceXLib ResNet50 Detection",
    },
    {
        "url": "https://github.com/xinntao/facexlib/releases/download/v0.2.2/parsing_parsenet.pth",
        "target": GFPGAN_DIR / "parsing_parsenet.pth",
        "desc": "FaceXLib ParseNet Parsing",
    },
]

BFM_ZIP_URL = "https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/BFM_Fitting.zip"


def download_with_progress(url: str, target_path: Path, desc: str):
    if target_path.exists() and target_path.stat().st_size > 1000:
        print(f"  [ALREADY EXISTS] {desc}: {target_path.name}")
        return

    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_target = target_path.with_suffix(".downloading")
    print(f"  [DOWNLOADING] {desc} ...")

    def progress_hook(count, block_size, total_size):
        if total_size > 0:
            percent = int(count * block_size * 100 / total_size)
            mb = (count * block_size) / (1024 * 1024)
            total_mb = total_size / (1024 * 1024)
            sys.stdout.write(f"\r    -> {percent}% ({mb:.1f} MB / {total_mb:.1f} MB)")
            sys.stdout.flush()

    try:
        urllib.request.urlretrieve(url, temp_target, reporthook=progress_hook)
        print()
        temp_target.replace(target_path)
        print(f"  [OK] Saved to {target_path.name}")
    except Exception as e:
        if temp_target.exists():
            temp_target.unlink()
        print(f"\n  [ERROR] Failed downloading {desc}: {e}")
        raise


def setup_bfm_fitting():
    bfm_extracted_dir = CHECKPOINTS_DIR / "BFM_Fitting"
    if (bfm_extracted_dir / "01_MorphableModel.mat").exists():
        print("  [ALREADY EXISTS] BFM_Fitting checkpoints verified.")
    else:
        zip_path = CHECKPOINTS_DIR / "BFM_Fitting.zip"
        download_with_progress(BFM_ZIP_URL, zip_path, "BFM_Fitting 3DMM Morphable Model (zip)")
        print("  [EXTRACTING] BFM_Fitting.zip ...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(CHECKPOINTS_DIR)
        print("  [OK] Extracted to checkpoints/BFM_Fitting")

    CONFIG_BFM_DIR.parent.mkdir(parents=True, exist_ok=True)
    if not CONFIG_BFM_DIR.exists() and bfm_extracted_dir.exists():
        print("  [LINKING] Copying BFM_Fitting to src/config/BFM_Fitting ...")
        shutil.copytree(bfm_extracted_dir, CONFIG_BFM_DIR, dirs_exist_ok=True)
        print("  [OK] BFM_Fitting configured for SadTalker src config")


def main():
    print("=" * 60)
    print("   AvatarAI Model Setup & Automated Downloader")
    print("   Compatible with macOS, Linux, and Windows")
    print("=" * 60)

    for item in DOWNLOADS:
        download_with_progress(item["url"], item["target"], item["desc"])

    print("\n--- Setting up 3DMM BFM Fitting Morphable Model ---")
    setup_bfm_fitting()

    print("\n" + "=" * 60)
    print(" [SUCCESS] All AI models and checkpoints are ready!")
    print("=" * 60)


if __name__ == "__main__":
    main()
