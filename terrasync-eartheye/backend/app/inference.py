import torch
import torchvision.transforms as transforms
import numpy as np
from PIL import Image
import io
import cv2
import base64
from app.model import DualHeadCNN
from app.gradcam import GradCAM, numpy_to_base64
from app.schemas import PredictionResult

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Initialize a global model
try:
    model = DualHeadCNN()
    # Try to load weights if exist, otherwise use random initial weights for demo
    # model.load_state_dict(torch.load("../models/model.pth", map_location=torch.device('cpu')))
    model.eval()
    gradcam_extractor = GradCAM(model)
except Exception as e:
    print(f"Warning: Model could not be fully initialized or loaded: {e}")
    model, gradcam_extractor = None, None

def determine_alert_level(deforestation_prob, water_prob):
    max_prob = max(deforestation_prob, water_prob)
    if max_prob > 0.8:
        return "CRITICAL"
    elif max_prob > 0.5:
        return "WARNING"
    else:
        return "NORMAL"

def get_base64_from_pil(image: Image.Image) -> str:
    buffered = io.BytesIO()
    image.convert("RGB").save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def run_inference(image_bytes: bytes) -> PredictionResult:
    # 1. Load image
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    original_img_array = np.array(img)
    raw_image_b64 = get_base64_from_pil(img)
    
    # 2. Preprocess
    input_tensor = TRANSFORM(img).unsqueeze(0)
    
    if model is None:
        raise ValueError("Model is not initialized.")
        
    # 3. Model Inference
    # We put model in eval mode and ensure gradients are tracked for gradcam
    model.eval()
    input_tensor.requires_grad_(True)
    
    defor_out, water_out, _ = model(input_tensor)
    
    # Calculate probabilities
    defor_probs = torch.softmax(defor_out, dim=1)[0].detach().numpy()
    water_probs = torch.softmax(water_out, dim=1)[0].detach().numpy()
    
    defor_prob = float(defor_probs[1]) # probability of class 1 (deforestation)
    water_prob = float(water_probs[1]) # probability of class 1 (water stress)
    
    # 4. Determine overall confidence & label
    max_prob = max(defor_prob, water_prob)
    if defor_prob > water_prob:
        label = "Deforestation Risk"
        confidence = defor_prob
        target_head = "deforestation"
    else:
        label = "Water Stress Risk"
        confidence = water_prob
        target_head = "water_stress"
        
    # If confidence is low, standard label
    if max_prob < 0.3:
        label = "Healthy Vegetation"
        confidence = 1.0 - max_prob
    
    # 5. Generate GradCAM with respect to the highest confident risk
    cam = gradcam_extractor.generate(input_tensor, head=target_head)
    overlay = gradcam_extractor.overlay_on_image(original_img_array, cam)
    gradcam_b64 = numpy_to_base64(overlay)
    
    # Calculate alert level
    alert_level = determine_alert_level(defor_prob, water_prob)
    
    return PredictionResult(
        label=label,
        confidence=confidence,
        deforestation_score=defor_prob,
        water_stress_score=water_prob,
        gradcam_image=gradcam_b64,
        raw_image=raw_image_b64,
        alert_level=alert_level,
        area_affected_ha=12.5 if alert_level != "NORMAL" else 0.0 # Mock estimation
    )
