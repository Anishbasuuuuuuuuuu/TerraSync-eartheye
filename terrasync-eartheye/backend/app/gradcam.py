import torch
import numpy as np
import cv2
from PIL import Image
import base64
import io

class GradCAM:
    def __init__(self, model):
        self.model = model
        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()
        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0].detach()
        target_layer = list(self.model.features.children())[-1]
        target_layer.register_forward_hook(forward_hook)
        target_layer.register_full_backward_hook(backward_hook)

    def generate(self, input_tensor, head="deforestation"):
        self.model.eval()
        input_tensor.requires_grad_(True)
        defor_out, water_out, _ = self.model(input_tensor)
        logits = defor_out if head == "deforestation" else water_out
        self.model.zero_grad()
        score = logits[0, logits.argmax().item()]
        score.backward()
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = torch.relu(cam)
        cam = cam.squeeze().numpy()
        cam -= cam.min()
        if cam.max() > 0:
            cam /= cam.max()
        return cam

    def overlay_on_image(self, original_img_array, cam):
        cam_resized = cv2.resize(cam, (original_img_array.shape[1], 
                                       original_img_array.shape[0]))
        heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), 
                                     cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        overlay = (0.5 * original_img_array + 0.5 * heatmap).astype(np.uint8)
        return overlay

def numpy_to_base64(img_array):
    img = Image.fromarray(img_array.astype(np.uint8))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
