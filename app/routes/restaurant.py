from fastapi import APIRouter, Form, HTTPException,UploadFile,File, Depends
from app.schemas.food_listing_schema import FoodListingResponse
from app.services.food_scan import scan_food
from app.database import get_db
from sqlalchemy.orm import Session
router = APIRouter(prefix="/restaurant")

@router.post("/scan-food")
async def scan_food_endpoint(file: UploadFile = File(...)):
   if not file.content_type.startswith("image/"):
    raise HTTPException(status_code=400, detail="File must be an image")
   try:
    result = scan_food(file.file)
    return result
   except Exception as e:
     raise HTTPException(status_code=400, detail=str(e))
   
@router.post("/confirm-quantity",response_model=FoodListingResponse)
async def confirm_quantity_endpoint(
    restaurant_id: int = Form(...),
    food_name: str = Form(...),
    quantity: int = Form(...),
    db: Session = Depends(get_db)
):
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    return {
        "food_name": food_name,
        "quantity": quantity,
        "message": f"Confirmed {quantity} servings of {food_name} for restaurant {restaurant_id}"
    }