from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.food_listing import FoodListing, ListingStatus
from app.models.restaurant import Restaurant
from app.schemas.food_listing_schema import FoodListingResponse
from app.schemas.claim_schema import ClaimCreate, ClaimResponse
from app.schemas.restaurant_schema import RestaurantMapItem
from app.services.security import require_role
from app.repositories.food_listing_repo import get_available_listings, get_listing_by_id
from app.repositories.claim_repo import (
    build_claim_response,
    create_claim,
    get_claim,
    get_claims_by_camp,
    mark_claim_picked_up,
)

router = APIRouter(prefix="/camp", tags=["camp"])
camp_only = require_role("camp")


# ── Available listings ────────────────────────────────────────────────────────

@router.get("/listings/available", response_model=List[FoodListingResponse])
def browse_available_listings(
    db: Session = Depends(get_db),
    _: User = Depends(camp_only),
):
    return get_available_listings(db)


# ── Map data ──────────────────────────────────────────────────────────────────

@router.get("/map", response_model=List[RestaurantMapItem])
def get_map_data(
    db: Session = Depends(get_db),
    _u: User = Depends(camp_only),   # enforces camp role; value not needed
):
    rows = (
        db.query(FoodListing, Restaurant)
        .join(Restaurant, FoodListing.restaurant_id == Restaurant.id)
        .filter(
            FoodListing.is_active == True,
            FoodListing.remaining_quantity > 0,
            Restaurant.latitude.isnot(None),
            Restaurant.longitude.isnot(None),
        )
        .all()
    )
    grouped: dict[int, RestaurantMapItem] = {}
    for listing, restaurant in rows:
        if restaurant.id not in grouped:
            grouped[restaurant.id] = RestaurantMapItem(
                restaurant_id   = restaurant.id,
                restaurant_name = restaurant.name,
                address         = restaurant.address,
                latitude        = restaurant.latitude,
                longitude       = restaurant.longitude,
                listings        = [],
            )
        grouped[restaurant.id].listings.append(FoodListingResponse.model_validate(listing))
    return list(grouped.values())


# ── Claim (with quantity + pickup ETA) ────────────────────────────────────────

@router.post("/listings/{listing_id}/claim", response_model=ClaimResponse, status_code=201)
def claim_food_listing(
    listing_id: int,
    body: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(camp_only),
):
    """
    Claim `body.quantity` portions of a listing with an optional pickup ETA.
    Multiple camps can claim portions of the same listing until it's fully claimed.
    Auto-releases back to the pool after AUTO_RELEASE_HOURS if not picked up.
    """
    if not current_user.camp_id:
        raise HTTPException(status_code=400, detail="Account not linked to a camp.")

    listing = get_listing_by_id(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if not listing.is_active or listing.remaining_quantity <= 0:
        raise HTTPException(status_code=409, detail="This listing has no remaining portions.")
    if body.quantity > listing.remaining_quantity:
        raise HTTPException(
            status_code=409,
            detail=f"Only {listing.remaining_quantity} portion(s) left — requested {body.quantity}.",
        )

    claim = create_claim(db, listing, current_user.camp_id, body)
    return build_claim_response(claim)


# ── Mark picked up (per-claim) ────────────────────────────────────────────────

@router.post("/claims/{claim_id}/pickup", response_model=ClaimResponse)
def pickup_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(camp_only),
):
    """Mark a specific claim as picked up. Only the claiming camp can do this."""
    claim = get_claim(db, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    if claim.camp_id != current_user.camp_id:
        raise HTTPException(status_code=403, detail="This claim belongs to a different camp.")
    if claim.status != "claimed":
        raise HTTPException(status_code=409, detail=f"Claim is already '{claim.status}'.")

    claim = mark_claim_picked_up(db, claim)
    return build_claim_response(claim)


# ── My claims ─────────────────────────────────────────────────────────────────

@router.get("/claims/mine", response_model=List[ClaimResponse])
def my_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(camp_only),
):
    if not current_user.camp_id:
        return []
    claims = get_claims_by_camp(db, current_user.camp_id)
    return [build_claim_response(c) for c in claims]
