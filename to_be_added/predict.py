import argparse
import os

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

MODEL_PATH = os.getenv(
    "MODEL_WEIGHTS_PATH",
    os.path.join(PROJECT_ROOT, "model", "weights", "resnet50_best.pth")
)

if not os.path.exists(MODEL_PATH):
    # Fallback to local to_be_added zip or model file if pth not extracted
    fallback_path = os.path.join(SCRIPT_DIR, "resnet50_best.pth.zip")
    if os.path.exists(fallback_path):
        MODEL_PATH = fallback_path


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ============================================================
# IMAGE TRANSFORM
# Same preprocessing used during validation
# ============================================================

transform = transforms.Compose([
    transforms.Resize(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# LOAD CHECKPOINT
# ============================================================

checkpoint = None
if os.path.exists(MODEL_PATH):
    try:
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
    except Exception as err:
        print(f"Warning: Failed to load model weights from {MODEL_PATH}: {err}")

if checkpoint is not None and "classes" in checkpoint:
    classes = checkpoint["classes"]
else:
    classes = [
        "Pepper__bell___Bacterial_spot", "Pepper__bell___healthy",
        "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
        "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_Late_blight",
        "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot",
        "Tomato_Spider_mites_Two_spotted_spider_mite", "Tomato__Target_Spot",
        "Tomato__Tomato_YellowLeaf__Curl_Virus", "Tomato__Tomato_mosaic_virus",
        "Tomato_healthy"
    ]

# Safety: convert to list if necessary
if isinstance(classes, dict):
    classes = [classes[k] for k in sorted(classes.keys(), key=lambda x: int(x))]


# ============================================================
# LOAD MODEL
# ============================================================

model = models.resnet50(weights=None)

model.fc = nn.Linear(
    model.fc.in_features,
    len(classes)
)

if checkpoint is not None and "model_state_dict" in checkpoint:
    model.load_state_dict(checkpoint["model_state_dict"])

model = model.to(DEVICE)
model.eval()


# ============================================================
# PREDICT
# ============================================================

def predict(image_path):

    image = Image.open(image_path).convert("RGB")

    image_tensor = transform(image)
    image_tensor = image_tensor.unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.softmax(outputs, dim=1)

        confidence, predicted = torch.max(probabilities, 1)

    predicted_index = predicted.item()
    predicted_class = classes[predicted_index]
    confidence = confidence.item() * 100

    print()
    print("=" * 55)
    print("AGRISMART-AI — PLANT DISEASE PREDICTION")
    print("=" * 55)
    print(f"Image      : {image_path}")
    print(f"Device     : {DEVICE}")
    print(f"Prediction : {predicted_class}")
    print(f"Confidence : {confidence:.2f}%")
    print("=" * 55)


# ============================================================
# COMMAND LINE
# ============================================================

if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="AGRISMART-AI Plant Disease Predictor"
    )

    parser.add_argument(
        "--image",
        required=True,
        help="Path to the image"
    )

    args = parser.parse_args()

    if not os.path.isfile(args.image):
        print(f"ERROR: Image not found: {args.image}")
        raise SystemExit(1)

    predict(args.image)