from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.inference import run_inference
from app.schemas import PredictionResult, LocationRequest, PredictionHistoryRecord
from app.satellite import fetch_satellite_image
from app.database import engine, get_db
from app.models_db import Base, PredictionRecord

# Initialize DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TerraSync EarthEye API", version="1.0.0")

# Allow all CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "TerraSync EarthEye API is running"}

@app.post("/predict", response_model=PredictionResult)
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    try:
        contents = await file.read()
        result = run_inference(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-location", response_model=PredictionResult)
async def predict_location(loc: LocationRequest, db: Session = Depends(get_db)):
    try:
        contents = fetch_satellite_image(loc.lat, loc.lon)
        result = run_inference(contents)
        
        # Save to SQLite Spatial History
        db_record = PredictionRecord(
            latitude=loc.lat,
            longitude=loc.lon,
            timestamp=datetime.utcnow(),
            label=result.label,
            alert_level=result.alert_level,
            confidence=result.confidence,
            deforestation_score=result.deforestation_score,
            water_stress_score=result.water_stress_score,
            area_affected_ha=result.area_affected_ha
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history", response_model=List[PredictionHistoryRecord])
def get_history(db: Session = Depends(get_db)):
    records = db.query(PredictionRecord).order_by(PredictionRecord.timestamp.desc()).all()
    # Format timestamp to string for the API schema
    for record in records:
        record.timestamp = record.timestamp.isoformat()
    return records
