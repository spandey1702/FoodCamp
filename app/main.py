import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine, SessionLocal
from app.routes import auth_route
from app.routes import restaurant as restaurant_route
from app.routes import camp as camp_route

logger = logging.getLogger(__name__)

LOCAL_IMAGE_DIR = Path(os.getenv("LOCAL_IMAGE_DIR", "/tmp/foodcamp_images"))
LOCAL_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

AUTO_RELEASE_CHECK_SECONDS = int(os.getenv("AUTO_RELEASE_CHECK_SECONDS", str(30 * 60)))  # 30 min


# ── Auto-release background task ──────────────────────────────────────────────

async def auto_release_loop() -> None:
    """
    Every AUTO_RELEASE_CHECK_SECONDS, find claims whose auto_release_at has
    passed and release their quantity back to the listing pool.
    """
    from app.repositories.claim_repo import get_expired_claims, release_claim

    while True:
        await asyncio.sleep(AUTO_RELEASE_CHECK_SECONDS)
        try:
            db = SessionLocal()
            expired = get_expired_claims(db)
            if expired:
                logger.info("Auto-releasing %d expired claim(s)…", len(expired))
            for claim in expired:
                release_claim(db, claim)
                logger.info(
                    "Released claim #%d (listing #%d, camp #%d)",
                    claim.id, claim.listing_id, claim.camp_id,
                )
            db.close()
        except Exception as exc:
            logger.error("Auto-release error: %s", exc)


# ── App lifespan ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(auto_release_loop())
    logger.info(
        "Auto-release task started (interval=%ds, window=%dh)",
        AUTO_RELEASE_CHECK_SECONDS,
        int(os.getenv("AUTO_RELEASE_HOURS", "4")),
    )
    yield
    task.cancel()


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="FoodCamp API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.mount("/static", StaticFiles(directory=str(LOCAL_IMAGE_DIR)), name="static")

app.include_router(auth_route.router)
app.include_router(restaurant_route.router)
app.include_router(camp_route.router)


@app.get("/")
def read_root():
    return {"message": "FoodCamp API is running."}
