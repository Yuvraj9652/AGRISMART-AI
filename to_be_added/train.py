import os
import json
import pandas as pd
import numpy as np
from PIL import Image

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models

from sklearn.metrics import (
    f1_score,
    accuracy_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# 1. CONFIG
# ============================================================

BATCH_SIZE = 32          # RTX 5060 8GB
IMAGE_SIZE = 224
EPOCHS = 10
LEARNING_RATE = 1e-4
NUM_WORKERS = 0
SEED = 42

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Device:", DEVICE)

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))


# ============================================================
# EXACT PATHS
# ============================================================

BASE_DIR = r"D:\AGRISMART-AI\dataset\PlantVillage"

TRAIN_CSV = os.path.join(
    BASE_DIR,
    "train.csv"
)

VAL_CSV = os.path.join(
    BASE_DIR,
    "val.csv"
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)

RESULTS_DIR = os.path.join(
    BASE_DIR,
    "results"
)


# ============================================================
# 2. REPRODUCIBILITY
# ============================================================

torch.manual_seed(SEED)
np.random.seed(SEED)

if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)


# ============================================================
# 3. DATASET
# ============================================================

class PlantDataset(Dataset):

    def __init__(self, dataframe, class_to_idx, transform=None):
        self.df = dataframe.reset_index(drop=True)
        self.class_to_idx = class_to_idx
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):

        row = self.df.iloc[idx]

        image_path = row["image_path"]
        label_name = row["class"]

        image = Image.open(image_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        label = self.class_to_idx[label_name]

        return image, label


# ============================================================
# 4. LOAD CSV
# ============================================================

print("\nLoading CSV files...")

print("Train CSV:", TRAIN_CSV)
print("Val CSV  :", VAL_CSV)

train_df = pd.read_csv(TRAIN_CSV)
val_df = pd.read_csv(VAL_CSV)

classes = sorted(train_df["class"].unique())

class_to_idx = {
    class_name: i
    for i, class_name in enumerate(classes)
}

idx_to_class = {
    i: class_name
    for class_name, i in class_to_idx.items()
}

NUM_CLASSES = len(classes)

print("\nClasses:")
for i, class_name in idx_to_class.items():
    print(i, "->", class_name)

print("\nNumber of classes:", NUM_CLASSES)


# ============================================================
# 5. TRANSFORMS
# ============================================================

# Augmentation ONLY for training
train_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.RandomHorizontalFlip(),

    transforms.RandomRotation(15),

    transforms.ColorJitter(
        brightness=0.2,
        contrast=0.2,
        saturation=0.2
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# Validation must remain clean
val_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# 6. DATA LOADERS
# ============================================================

train_dataset = PlantDataset(
    train_df,
    class_to_idx,
    train_transform
)

val_dataset = PlantDataset(
    val_df,
    class_to_idx,
    val_transform
)

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=NUM_WORKERS,
    pin_memory=True
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=NUM_WORKERS,
    pin_memory=True
)


# ============================================================
# 7. RESNET50
# ============================================================

print("\nLoading ResNet50...")

weights = models.ResNet50_Weights.DEFAULT

model = models.resnet50(weights=weights)

# Replace final classifier
model.fc = nn.Linear(
    model.fc.in_features,
    NUM_CLASSES
)

model = model.to(DEVICE)


# ============================================================
# 8. LOSS + OPTIMIZER
# ============================================================

criterion = nn.CrossEntropyLoss()

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=1e-4
)


# ============================================================
# 9. TRAINING
# ============================================================

best_f1 = 0.0

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


for epoch in range(EPOCHS):

    # -------------------------
    # TRAIN
    # -------------------------

    model.train()

    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:

        images = images.to(
            DEVICE,
            non_blocking=True
        )

        labels = labels.to(
            DEVICE,
            non_blocking=True
        )

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(
            outputs,
            labels
        )

        loss.backward()

        optimizer.step()

        running_loss += loss.item()

        predictions = outputs.argmax(dim=1)

        correct += (
            predictions == labels
        ).sum().item()

        total += labels.size(0)

    train_loss = running_loss / len(train_loader)

    train_accuracy = correct / total


    # -------------------------
    # VALIDATION
    # -------------------------

    model.eval()

    val_predictions = []
    val_labels = []

    val_loss = 0.0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(
                DEVICE,
                non_blocking=True
            )

            labels = labels.to(
                DEVICE,
                non_blocking=True
            )

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

            val_loss += loss.item()

            predictions = outputs.argmax(dim=1)

            val_predictions.extend(
                predictions.cpu().numpy()
            )

            val_labels.extend(
                labels.cpu().numpy()
            )


    val_loss /= len(val_loader)

    val_accuracy = accuracy_score(
        val_labels,
        val_predictions
    )

    val_macro_f1 = f1_score(
        val_labels,
        val_predictions,
        average="macro"
    )


    print(
        f"\nEpoch [{epoch+1}/{EPOCHS}]"
    )

    print(
        f"Train Loss: {train_loss:.4f}"
    )

    print(
        f"Train Accuracy: {train_accuracy:.4f}"
    )

    print(
        f"Val Loss: {val_loss:.4f}"
    )

    print(
        f"Val Accuracy: {val_accuracy:.4f}"
    )

    print(
        f"Val Macro-F1: {val_macro_f1:.4f}"
    )


    # -------------------------
    # SAVE BEST MODEL
    # -------------------------

    if val_macro_f1 > best_f1:

        best_f1 = val_macro_f1

        torch.save(
            {
                "model_state_dict": model.state_dict(),
                "class_to_idx": class_to_idx,
                "classes": classes
            },
            os.path.join(
                MODELS_DIR,
                "resnet50_best.pth"
            )
        )

        print(
            f"✓ Best model saved "
            f"(Macro-F1 = {best_f1:.4f})"
        )


# ============================================================
# 10. FINAL REPORT
# ============================================================

print("\n================================")
print("FINAL VALIDATION RESULTS")
print("================================")

print(
    classification_report(
        val_labels,
        val_predictions,
        target_names=classes,
        digits=4
    )
)

cm = confusion_matrix(
    val_labels,
    val_predictions
)

np.savetxt(
    os.path.join(
        RESULTS_DIR,
        "confusion_matrix.csv"
    ),
    cm,
    delimiter=",",
    fmt="%d"
)

with open(
    os.path.join(
        RESULTS_DIR,
        "classes.json"
    ),
    "w"
) as f:
    json.dump(
        class_to_idx,
        f,
        indent=4
    )

print("\nBest Macro-F1:", best_f1)

print("\nSaved:")
print(
    os.path.join(
        MODELS_DIR,
        "resnet50_best.pth"
    )
)

print(
    os.path.join(
        RESULTS_DIR,
        "confusion_matrix.csv"
    )
)

print(
    os.path.join(
        RESULTS_DIR,
        "classes.json"
    )
)