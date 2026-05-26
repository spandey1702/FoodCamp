"""
S3 upload helpers.

If AWS credentials are not configured the service falls back to storing
images locally under /tmp/foodcamp_images/ and returning a local URL —
so the app stays fully functional in dev without AWS.
"""
import os
import uuid
import logging
from pathlib import Path
from typing import BinaryIO

from app.config import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME

logger = logging.getLogger(__name__)

# ── Try to import boto3 gracefully ────────────────────────────────────────────
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
    _BOTO3_AVAILABLE = True
except ImportError:
    _BOTO3_AVAILABLE = False


def _s3_client():
    if not _BOTO3_AVAILABLE:
        return None
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        return None
    return boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )


# ── Public API ────────────────────────────────────────────────────────────────

def upload_image(file: BinaryIO, content_type: str = "image/jpeg") -> str:
    """
    Upload *file* to S3 (or local fallback) and return a public URL string.
    Raises RuntimeError on failure.
    """
    key = f"food_images/{uuid.uuid4()}.jpg"
    client = _s3_client()

    if client:
        return _upload_to_s3(client, file, key, content_type)
    else:
        logger.warning("S3 not configured — storing image locally.")
        return _upload_locally(file, key)


def _upload_to_s3(client, file: BinaryIO, key: str, content_type: str) -> str:
    try:
        client.upload_fileobj(
            file,
            S3_BUCKET_NAME,
            key,
            ExtraArgs={
                "ContentType": content_type,
                "ACL": "public-read",
            },
        )
        url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}"
        logger.info("Uploaded to S3: %s", url)
        return url
    except Exception as exc:
        raise RuntimeError(f"S3 upload failed: {exc}") from exc


def _upload_locally(file: BinaryIO, key: str) -> str:
    """Save the file to LOCAL_IMAGE_DIR and return a full URL served by FastAPI /static/."""
    local_dir = Path(os.getenv("LOCAL_IMAGE_DIR", "/tmp/foodcamp_images"))
    local_dir.mkdir(parents=True, exist_ok=True)
    # Flatten the S3-style key into a single filename: "food_images/uuid.jpg" → "food_images_uuid.jpg"
    filename = key.replace("/", "_")
    dest = local_dir / filename
    dest.write_bytes(file.read())
    # FastAPI mounts LOCAL_IMAGE_DIR at /static/ — return the full absolute URL
    api_base = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
    url = f"{api_base}/static/{filename}"
    logger.info("Saved locally: %s → %s", dest, url)
    return url
