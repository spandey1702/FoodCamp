import datetime
from PIL import Image
from fastapi import HTTPException
from app.ml.loadModel import predict
from app.database import Session
from app.models.food_listing import FoodListing
from app.schemas.food_listing_schema import FoodListingCreate, FoodListingResponse
from app.repositories.food_listing_repo import create_food_listing

def scan_food(file)->dict:
    try:
        image=Image.open(file).convert("RGB")
        food_name, confidence = predict(image)
        confidence_percentage = round(confidence * 100, 2)
        return {
            "food_name": food_name,
         "confidence": confidence_percentage
        }
    except Exception as e:
        print(f"Error during food scanning: {e}")
        return {
            "error": "Unable to process the image. Please try again with a different image."
        }
    
def confirm_quantity(food_name:str, quantity:int,restaurant_id:str)->dict:
    if(quantity<=0):
        return {
            "error": "Quantity must be more the one."
        }
    
    return {
        "food_name": food_name,
        "quantity": quantity,
        "message": f"Confirmed {quantity} servings of {food_name}"
    }

def save_listing_service(food_listing: FoodListingCreate, db: Session) -> FoodListingResponse:
    try:
        is_active = getattr(food_listing, "is_active", True)

        listing_dict = {
            "restaurant_id": food_listing.restaurant_id,
            "food_name": food_listing.food_name,
            "quantity": food_listing.quantity,
            "is_active": is_active,
            "created_at": datetime.utcnow()  
          }

        listing = create_food_listing(db, listing_dict)

        response = FoodListingResponse(
            id=listing.id,
            restaurant_id=listing.restaurant_id,
            food_name=listing.food_name,
            quantity=listing.quantity,
            created_at=listing.created_at.isoformat(),
            is_active=listing.is_active,
            message="Food listing saved successfully"
        )
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving food listing: {e}")