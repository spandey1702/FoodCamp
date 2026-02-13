import os
import torch
import torch.nn as nn
from torchvision.models import resnet50
from urllib.request import urlretrieve
from ml.preprocess import image_transform  # your preprocessing transforms
from PIL import Image

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

WEIGHTS_PATH = "food101_resnet50.pth"
WEIGHTS_URL = "https://your-server.com/path/food101_resnet50.pth"  # host your weights somewhere

if not os.path.exists(WEIGHTS_PATH):
    print("Weights not found locally. Downloading...")
    urlretrieve(WEIGHTS_URL, WEIGHTS_PATH)
    print("Download complete!")


_model = resnet50(pretrained=False)  # No ImageNet download
_model.fc = nn.Linear(_model.fc.in_features, 101)  # Food-101 has 101 classes


_model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
_model.eval()
_model.to(device)


with open("food101_labels.txt") as f:
    FOOD_LABELS = [line.strip() for line in f]


def predict(image: Image.Image):

    input_tensor = image_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = _model(input_tensor)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probs, 1)

    food_name = FOOD_LABELS[predicted.item()]

    return food_name, confidence.item()