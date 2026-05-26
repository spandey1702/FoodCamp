from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.models.claim import Claim, ClaimStatus, AUTO_RELEASE_HOURS
from app.models.food_listing import FoodListing, ListingStatus
from app.schemas.claim_schema import ClaimCreate, ClaimResponse


def create_claim(db: Session, listing: FoodListing, camp_id: int, data: ClaimCreate) -> Claim:
    """
    Deduct data.quantity from listing.remaining_quantity and insert a Claim row.
    Caller must have already verified remaining_quantity >= data.quantity.
    """
    now = datetime.now(timezone.utc)
    claim = Claim(
        listing_id      = listing.id,
        camp_id         = camp_id,
        quantity        = data.quantity,
        pickup_eta      = data.pickup_eta,
        status          = ClaimStatus.CLAIMED,
        claimed_at      = now,
        auto_release_at = Claim.make_auto_release_at(now),
    )
    db.add(claim)

    listing.remaining_quantity -= data.quantity
    if listing.remaining_quantity == 0:
        listing.status = ListingStatus.FULLY_CLAIMED

    db.commit()
    db.refresh(claim)
    return claim


def get_claim(db: Session, claim_id: int) -> Optional[Claim]:
    return db.query(Claim).filter(Claim.id == claim_id).first()


def mark_claim_picked_up(db: Session, claim: Claim) -> Claim:
    claim.status       = ClaimStatus.PICKED_UP
    claim.picked_up_at = datetime.now(timezone.utc)

    # If all sibling claims are done, close the listing
    listing = claim.listing
    active_claims = [
        c for c in listing.claims
        if c.id != claim.id and c.status == ClaimStatus.CLAIMED
    ]
    if not active_claims and listing.remaining_quantity == 0:
        listing.status    = ListingStatus.COMPLETED
        listing.is_active = False

    db.commit()
    db.refresh(claim)
    return claim


def release_claim(db: Session, claim: Claim) -> Claim:
    """Return the claimed quantity back to the listing pool."""
    claim.status = ClaimStatus.RELEASED

    listing = claim.listing
    listing.remaining_quantity += claim.quantity
    if listing.status == ListingStatus.FULLY_CLAIMED:
        listing.status = ListingStatus.PENDING   # back to available

    db.commit()
    db.refresh(claim)
    return claim


def get_expired_claims(db: Session) -> list[Claim]:
    """All CLAIMED entries whose auto_release_at is in the past."""
    return (
        db.query(Claim)
        .filter(
            Claim.status == ClaimStatus.CLAIMED,
            Claim.auto_release_at <= datetime.now(timezone.utc),
        )
        .all()
    )


def get_claims_by_camp(db: Session, camp_id: int) -> list[Claim]:
    return (
        db.query(Claim)
        .filter(Claim.camp_id == camp_id)
        .order_by(Claim.claimed_at.desc())
        .all()
    )


def build_claim_response(claim: Claim) -> ClaimResponse:
    """Attach denormalised listing fields to a ClaimResponse."""
    listing = claim.listing
    return ClaimResponse(
        id              = claim.id,
        listing_id      = claim.listing_id,
        camp_id         = claim.camp_id,
        quantity        = claim.quantity,
        pickup_eta      = claim.pickup_eta,
        status          = claim.status,
        claimed_at      = claim.claimed_at,
        auto_release_at = claim.auto_release_at,
        picked_up_at    = claim.picked_up_at,
        food_name       = listing.food_name if listing else None,
        image_url       = listing.image_url if listing else None,
        restaurant_name = listing.restaurant.name if listing and listing.restaurant else None,
    )
