import os
import ssl

# Bypass SSL verification for EuroSAT download
ssl._create_default_https_context = ssl._create_unverified_context

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import datasets, transforms
import mlflow
from tqdm import tqdm
from app.model import DualHeadCNN

# Mapping EuroSAT 10 classes to 2 proxies for Deforestation and Water Stress
# EuroSAT Classes: 'AnnualCrop', 'Forest', 'HerbaceousVegetation', 'Highway', 'Industrial', 'Pasture', 'PermanentCrop', 'Residential', 'River', 'SeaLake'
class DualHeadEuroSAT(Dataset):
    def __init__(self, root="./data", download=True, transform=None):
        self.base_dataset = datasets.EuroSAT(root=root, download=download, transform=transform)
        # Class index map
        self.class_to_idx = self.base_dataset.class_to_idx
        
        # Deforestation Risk: 0 if Forest, 1 otherwise
        self.forest_idx = self.class_to_idx.get('Forest', -1)
        
        # Water Stress Risk: 0 if River or SeaLake (plenty of water), 1 otherwise
        self.river_idx = self.class_to_idx.get('River', -1)
        self.lake_idx = self.class_to_idx.get('SeaLake', -1)
        
    def __len__(self):
        return len(self.base_dataset)
        
    def __getitem__(self, idx):
        img, label = self.base_dataset[idx]
        
        defor_label = 0 if label == self.forest_idx else 1
        water_label = 0 if label in [self.river_idx, self.lake_idx] else 1
        
        return img, torch.tensor(defor_label, dtype=torch.long), torch.tensor(water_label, dtype=torch.long)

def train_model():
    print("Initializing TerraSync EarthEye Training with EuroSAT and MLflow...")
    os.makedirs("models", exist_ok=True)
    
    # 1. Transformations
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # 2. Dataset and DataLoaders
    # This will download the dataset if not present
    full_dataset = DualHeadEuroSAT(root="./data", download=True, transform=transform)
    
    # Use a small subset for demonstration purposes to avoid waiting hours
    # In a true global deployment this would use the whole dataset (~27,000 images)
    # We take 500 images to show the pipeline working
    subset_indices = torch.randperm(len(full_dataset))[:500]
    subset = torch.utils.data.Subset(full_dataset, subset_indices)
    
    train_size = int(0.8 * len(subset))
    val_size = len(subset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(subset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    
    # 3. Model, Loss, Optimizer
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = DualHeadCNN().to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    EPOCHS = 3
    
    # 4. MLflow Tracking
    mlflow.set_tracking_uri("sqlite:///mlflow.db")
    mlflow.set_experiment("EuroSAT_Dualhead_Training")
    
    with mlflow.start_run():
        mlflow.log_param("epochs", EPOCHS)
        mlflow.log_param("batch_size", 32)
        mlflow.log_param("optimizer", "Adam")
        mlflow.log_param("learning_rate", 0.001)
        
        best_val_loss = float('inf')
        
        for epoch in range(EPOCHS):
            # Training Phase
            model.train()
            train_loss = 0.0
            
            progress_bar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Train]")
            for imgs, defor_labels, water_labels in progress_bar:
                imgs, defor_labels, water_labels = imgs.to(device), defor_labels.to(device), water_labels.to(device)
                
                optimizer.zero_grad()
                defor_out, water_out, _ = model(imgs)
                
                loss_defor = criterion(defor_out, defor_labels)
                loss_water = criterion(water_out, water_labels)
                loss = loss_defor + loss_water
                
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item() * imgs.size(0)
                progress_bar.set_postfix({"Loss": loss.item()})
                
            train_loss /= len(train_loader.dataset)
            
            # Validation Phase
            model.eval()
            val_loss = 0.0
            correct_defor = 0
            correct_water = 0
            
            with torch.no_grad():
                for imgs, defor_labels, water_labels in tqdm(val_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Val]"):
                    imgs, defor_labels, water_labels = imgs.to(device), defor_labels.to(device), water_labels.to(device)
                    
                    defor_out, water_out, _ = model(imgs)
                    
                    loss_defor = criterion(defor_out, defor_labels)
                    loss_water = criterion(water_out, water_labels)
                    loss = loss_defor + loss_water
                    
                    val_loss += loss.item() * imgs.size(0)
                    
                    defor_preds = torch.argmax(defor_out, dim=1)
                    water_preds = torch.argmax(water_out, dim=1)
                    
                    correct_defor += torch.sum(defor_preds == defor_labels).item()
                    correct_water += torch.sum(water_preds == water_labels).item()
            
            val_loss /= len(val_loader.dataset)
            acc_defor = correct_defor / len(val_loader.dataset)
            acc_water = correct_water / len(val_loader.dataset)
            
            print(f"Epoch {epoch+1}: Train Loss = {train_loss:.4f}, Val Loss = {val_loss:.4f}, Defor Acc = {acc_defor:.2f}, Water Acc = {acc_water:.2f}")
            
            mlflow.log_metric("train_loss", train_loss, step=epoch)
            mlflow.log_metric("val_loss", val_loss, step=epoch)
            mlflow.log_metric("val_defor_acc", acc_defor, step=epoch)
            mlflow.log_metric("val_water_acc", acc_water, step=epoch)
            
            # Save Best Model
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save(model.state_dict(), "models/model.pth")
                mlflow.log_artifact("models/model.pth")
                
        print("Training complete! Best model saved to models/model.pth.")

if __name__ == "__main__":
    train_model()
