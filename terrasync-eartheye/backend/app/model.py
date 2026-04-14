import torch
import torch.nn as nn
from torchvision import models

class DualHeadCNN(nn.Module):
    def __init__(self):
        super(DualHeadCNN, self).__init__()
        backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        self.features = nn.Sequential(*list(backbone.children())[:-2])
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.deforestation_head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(512, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 2)
        )
        self.water_stress_head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(512, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 2)
        )

    def forward(self, x):
        features = self.features(x)
        pooled = self.pool(features)
        deforestation_logits = self.deforestation_head(pooled)
        water_logits = self.water_stress_head(pooled)
        return deforestation_logits, water_logits, features
