from pydantic import BaseModel
from typing import Optional

class PredictionResult(BaseModel):
    label: str
    confidence: float
    deforestation_score: float
    water_stress_score: float
    gradcam_image: str
    raw_image: str
    alert_level: str
    area_affected_ha: Optional[float] = None

class LocationRequest(BaseModel):
    lat: float
    lon: float
    zoom: Optional[int] = 15

class PredictionHistoryRecord(BaseModel):
    id: int
    latitude: float
    longitude: float
    timestamp: str
    label: str
    alert_level: str
    confidence: float
    deforestation_score: float
    water_stress_score: float
    area_affected_ha: Optional[float] = None

    class Config:
        from_attributes = True

