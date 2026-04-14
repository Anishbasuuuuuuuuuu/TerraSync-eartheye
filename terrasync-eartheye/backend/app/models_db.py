from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from app.database import Base

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    label = Column(String)
    alert_level = Column(String)
    confidence = Column(Float)
    deforestation_score = Column(Float)
    water_stress_score = Column(Float)
    area_affected_ha = Column(Float)
