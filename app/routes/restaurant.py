from fastapi import APIRouter, Form, HTTPException,UploadFile,File
from app.services.food_scan import scan_food

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
   
@router.post("/confirm-quantity")
async def confirm_quantity_endpoint(restaurant_id: str = Form(...),
    food_name: str = Form(...),
    quantity: int = Form(...)):
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    return {
        "food_name": food_name,
        "quantity": quantity,
        "message": f"Confirmed {quantity} servings of {food_name} for restaurant {restaurant_id}"
    }