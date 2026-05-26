"""
Loads a ResNet-50 fine-tuned on Food-101.

Weight file is resolved in this order:
  1. $MODEL_WEIGHTS_PATH env var
  2. app/ml/food101_resnet50.pth  (alongside this file)

If neither exists the model will NOT be loaded and predict() raises a
RuntimeError, allowing the rest of the app to start cleanly.
"""
import os
import logging
from pathlib import Path

import torch
import torch.nn as nn
from torchvision.models import resnet50

from app.ml.preprocess import image_transform
from PIL import Image

logger = logging.getLogger(__name__)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Locate weights ────────────────────────────────────────────────────────────
_here = Path(__file__).parent
WEIGHTS_PATH = os.getenv("MODEL_WEIGHTS_PATH", str(_here / "food101_resnet50.pth"))
LABELS_PATH = os.getenv("MODEL_LABELS_PATH", str(_here / "food101_labels.txt"))

# ── Load labels ───────────────────────────────────────────────────────────────
if not Path(LABELS_PATH).exists():
    raise FileNotFoundError(f"Food-101 labels file not found: {LABELS_PATH}")

with open(LABELS_PATH) as f:
    FOOD_LABELS = [line.strip() for line in f if line.strip()]

assert len(FOOD_LABELS) == 101, f"Expected 101 labels, got {len(FOOD_LABELS)}"

# ── Build model skeleton ───────────────────────────────────────────────────────
_model = resnet50(weights=None)
_model.fc = nn.Linear(_model.fc.in_features, 101)

# ── Load weights (optional) ───────────────────────────────────────────────────
_model_ready = False
if Path(WEIGHTS_PATH).exists():
    try:
        state = torch.load(WEIGHTS_PATH, map_location=device)
        _model.load_state_dict(state)
        _model.eval()
        _model.to(device)
        _model_ready = True
        logger.info("Food-101 model loaded from %s", WEIGHTS_PATH)
    except Exception as exc:
        logger.warning("Could not load model weights: %s", exc)
else:
    logger.warning(
        "Model weights not found at %s. "
        "Place food101_resnet50.pth there or set MODEL_WEIGHTS_PATH.",
        WEIGHTS_PATH,
    )


# ── Prediction ────────────────────────────────────────────────────────────────

def predict(image: Image.Image) -> tuple[str, float]:
    """Return (food_name, confidence_0_to_1).  Raises RuntimeError if no weights."""
    if not _model_ready:
        raise RuntimeError(
            "Model weights are not loaded. "
            "Place food101_resnet50.pth in app/ml/ or set MODEL_WEIGHTS_PATH."
        )

    tensor = image_transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = _model(tensor)
        probs = torch.softmax(logits, dim=1)
        confidence, idx = torch.max(probs, dim=1)

    food_name = FOOD_LABELS[idx.item()].replace("_", " ").title()
    return food_name, round(confidence.item(), 4)
