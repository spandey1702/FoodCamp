from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.food_listing_schema import FoodListingCreate, FoodListingResponse
from app.schemas.restaurant_schema import RestaurantCreate, RestaurantResponse
from app.services.food_scan import scan_food
from app.services.geocode import geocode
from app.services.s3_service import upload_image
from app.services.security import require_role
from app.repositories.food_listing_repo import (
    create_food_listing,
    get_listings_by_restaurant,
)

router = APIRouter(prefix="/restaurant", tags=["restaurant"])

restaurant_only = require_role("restaurant")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/all", response_model=list[RestaurantResponse])
def get_all_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).all()


@router.post("/create", response_model=RestaurantResponse, status_code=201)
def create_restaurant(payload: RestaurantCreate, db: Session = Depends(get_db)):
    """Create a restaurant row and auto-geocode its address (used during onboarding)."""
    lat = lon = None
    if payload.address:
        coords = geocode(payload.address)
        if coords:
            lat, lon = coords

    restaurant = Restaurant(
        name=payload.name,
        address=payload.address,
        phone_number=payload.phone_number,
        latitude=lat,
        longitude=lon,
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.post("/scan-food")
async def scan_food_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(restaurant_only),
):
    """
    Step 1 — Upload a food image; AI returns the detected food name + confidence.
    The image is NOT saved yet. Call /upload to confirm quantity and persist.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    return scan_food(file.file)


@router.post("/upload", response_model=FoodListingResponse, status_code=status.HTTP_201_CREATED)
async def upload_food_listing(
    food_name: str = Form(...),   # populated from scan result — user never types this
    quantity: int = Form(...),    # only field the user fills in
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(restaurant_only),
):
    """
    Step 2 — Confirm quantity, upload image to S3/local, and save listing.
    restaurant_id is taken from the JWT — never trusted from the client.
    """
    if not current_user.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is not linked to a restaurant. Contact an admin.",
        )

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    image_url = upload_image(file.file, content_type=file.content_type)

    listing_data = FoodListingCreate(
        restaurant_id=current_user.restaurant_id,
        food_name=food_name,
        quantity=quantity,
    )
    return create_food_listing(db, listing_data, image_url=image_url)


@router.get("/listings", response_model=list[FoodListingResponse])
def get_listings(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(restaurant_only),
):
    """
    Returns all listings for the authenticated restaurant.
    Pass ?active_only=true to filter to pending/claimed only.
    """
    if not current_user.restaurant_id:
        raise HTTPException(status_code=400, detail="Account not linked to a restaurant.")
    return get_listings_by_restaurant(db, current_user.restaurant_id, active_only=active_only)
