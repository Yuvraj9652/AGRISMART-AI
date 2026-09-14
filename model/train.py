import os
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split
from config import IMAGE_SIZE, NORMALIZE_MEAN, NORMALIZE_STD, MODEL_WEIGHTS_PATH, CLASS_NAMES

def train():
    # Setup CPU threading for optimal execution
    num_cpus = os.cpu_count() or 4
    torch.set_num_threads(num_cpus)

    # Setup paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_dir = os.path.join(base_dir, "dataset", "PlantVillage")
    
    if not os.path.exists(dataset_dir):
        print(f"Error: Dataset directory {dataset_dir} not found. Please ensure archive.zip is extracted properly.")
        return

    # Hyperparameters
    batch_size = 64
    num_epochs = 1
    learning_rate = 0.001

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device} (CPU Threads: {num_cpus})")

    # Transforms
    transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=NORMALIZE_MEAN, std=NORMALIZE_STD)
    ])

    # Load dataset
    print(f"Loading dataset from: {dataset_dir}")
    full_dataset = datasets.ImageFolder(root=dataset_dir, transform=transform)
    
    # Check classes
    if len(full_dataset.classes) != len(CLASS_NAMES):
        print(f"Warning: Dataset has {len(full_dataset.classes)} classes, but config defines {len(CLASS_NAMES)}.")
        
    # Split into 80% train and 20% test
    train_size = int(0.8 * len(full_dataset))
    test_size = len(full_dataset) - train_size
    train_dataset, test_dataset = random_split(full_dataset, [train_size, test_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    print(f"Dataset split: {train_size} training images, {test_size} testing images.")

    # Initialize Model
    print("Initializing ResNet50 model with ImageNet pre-trained weights...", flush=True)
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
    
    # Freeze initial layers (conv1 to layer3) to optimize CPU speed
    for param in model.parameters():
        param.requires_grad = False
        
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, len(CLASS_NAMES))
    
    # Enable gradients for layer4 and classification head (fc)
    for param in model.layer4.parameters():
        param.requires_grad = True
    for param in model.fc.parameters():
        param.requires_grad = True

    model = model.to(device)

    # Loss and Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=learning_rate)

    start_train_time = time.time()
    print("Starting fine-tuning training (Layer4 + FC)...", flush=True)
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0
        epoch_start = time.time()
        
        for i, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total_train += labels.size(0)
            correct_train += (predicted == labels).sum().item()
            
            if (i + 1) % 5 == 0 or (i + 1) == len(train_loader):
                batch_acc = 100 * correct_train / total_train
                elapsed = time.time() - epoch_start
                print(f"Epoch [{epoch+1}/{num_epochs}], Step [{i+1}/{len(train_loader)}], Loss: {running_loss/5:.4f}, Current Train Acc: {batch_acc:.2f}% ({elapsed:.1f}s)", flush=True)
                running_loss = 0.0

        train_accuracy = 100 * correct_train / total_train
        print(f"\n==================================================")
        print(f"Epoch [{epoch+1}/{num_epochs}] completed in {time.time() - epoch_start:.2f}s.")
        print(f"Exact Training Accuracy: {train_accuracy:.2f}%")
        print(f"==================================================\n")

        # Validation phase
        print("Starting validation on testing data...")
        model.eval()
        correct_test = 0
        total_test = 0
        val_start = time.time()
        
        with torch.no_grad():
            for inputs, labels in test_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, predicted = torch.max(outputs.data, 1)
                total_test += labels.size(0)
                correct_test += (predicted == labels).sum().item()
                
        test_accuracy = 100 * correct_test / total_test
        print(f"==================================================")
        print(f"Validation completed in {time.time() - val_start:.2f}s.")
        print(f"Exact Testing Accuracy for Epoch [{epoch+1}/{num_epochs}]: {test_accuracy:.2f}%")
        print(f"==================================================\n")

    total_duration = time.time() - start_train_time
    print(f"Training and evaluation finished in {total_duration:.2f} seconds.")

    # Save weights
    os.makedirs(os.path.dirname(MODEL_WEIGHTS_PATH), exist_ok=True)
    torch.save(model.state_dict(), MODEL_WEIGHTS_PATH)
    print(f"Model weights saved to {MODEL_WEIGHTS_PATH}")

if __name__ == "__main__":
    train()
