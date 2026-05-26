import os
import random
from typing import BinaryIO
from PIL import Image
from fastapi import HTTPException

# Set MOCK_SCAN=true in .env to get a fake prediction without model weights
_MOCK = os.getenv("MOCK_SCAN", "false").lower() == "true"

_MOCK_FOODS = [
    "Pizza", "Sushi", "Ramen", "Tacos", "Hamburger",
    "Pasta Carbonara", "Fried Rice", "Pancakes", "Caesar Salad", "Waffles",
]


def scan_food(file: BinaryIO) -> dict:
    """
    Run Food-101 inference on the uploaded image.
    Returns {"food_name": str, "confidence": float (0–100)}.

    Set MOCK_SCAN=true in .env to bypass the model for dev/testing.
    """
    if _MOCK:
        food_name = random.choice(_MOCK_FOODS)
        return {"food_name": food_name, "confidence": round(random.uniform(78, 97), 2)}

    try:
        from app.ml.loadModel import predict  # lazy — skips weight error at startup

        image = Image.open(file).convert("RGB")
        food_name, confidence = predict(image)
        return {
            "food_name": food_name,
            "confidence": round(confidence * 100, 2),
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to process image: {exc}")
