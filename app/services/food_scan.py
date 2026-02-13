from PIL import Image
from app.ml.loadModel import predict

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