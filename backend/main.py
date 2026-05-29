"""
FastAPI backend for Ocean Climate & Coral Bleaching Prediction Dashboard.

Endpoints serve dataset summaries, ML predictions, visualization data,
and model performance metrics to the React frontend.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from data_processing import (
    generate_insights,
    get_summary_statistics,
    load_and_clean_data,
    build_visualization_data,
)
from model import (
    load_metrics,
    predict_bleaching,
    predict_species,
    train_models,
)

# Cached dataframe loaded once at startup
_df = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load data and train models on startup if artifacts don't exist."""
    global _df
    _df = load_and_clean_data()
    train_models()
    yield


app = FastAPI(
    title="Ocean Climate & Coral Bleaching API",
    description="Predict coral bleaching risk and species biodiversity from ocean climate data.",
    version="1.0.0",
    lifespan=lifespan,
)

_cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
if os.getenv("FRONTEND_URL"):
    _cors_origins.append(os.getenv("FRONTEND_URL").rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins= cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionInput(BaseModel):
    location: str = Field(..., description="Reef location name")
    sst: float = Field(..., ge=20, le=35, description="Sea surface temperature in °C")
    ph: float = Field(..., ge=7.5, le=8.5, description="Ocean pH level")
    marine_heatwave: bool = Field(..., description="Marine heatwave present")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


@app.get("/")
def root():
    return {"message": "Ocean Climate & Coral Bleaching Prediction API", "docs": "/docs"}


@app.get("/summary")
def summary():
    """Return dataset summary statistics for overview cards."""
    return get_summary_statistics(_df)


@app.post("/predict-bleaching")
def predict_bleaching_endpoint(body: PredictionInput):
    """
    Predict coral bleaching severity from user-supplied ocean conditions.

    Uses Random Forest classifier trained on SST, pH, location, heatwave, coordinates.
    """
    valid_locations = _df["Location"].unique().tolist()
    if body.location not in valid_locations:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid location. Choose from: {valid_locations}",
        )
    return predict_bleaching(
        location=body.location,
        sst=body.sst,
        ph=body.ph,
        marine_heatwave=body.marine_heatwave,
        latitude=body.latitude,
        longitude=body.longitude,
    )


@app.post("/predict-species")
def predict_species_endpoint(body: PredictionInput):
    """
    Predict species observed count (biodiversity proxy) from ocean conditions.

    Uses Random Forest regressor — higher counts suggest healthier reef ecosystems.
    """
    valid_locations = _df["Location"].unique().tolist()
    if body.location not in valid_locations:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid location. Choose from: {valid_locations}",
        )
    return predict_species(
        location=body.location,
        sst=body.sst,
        ph=body.ph,
        marine_heatwave=body.marine_heatwave,
        latitude=body.latitude,
        longitude=body.longitude,
    )


@app.get("/visualizations")
def visualizations():
    """Return chart-ready JSON for all dashboard visualizations."""
    data = build_visualization_data(_df)
    data["insights"] = generate_insights(_df)
    return data


@app.get("/model-metrics")
def model_metrics():
    """Return train/test performance metrics for both ML models."""
    return load_metrics()


@app.get("/locations")
def locations():
    """Return available locations with default coordinates for form pre-fill."""
    loc_data = (
        _df.groupby("Location")
        .agg(
            latitude=("Latitude", "mean"),
            longitude=("Longitude", "mean"),
            avg_sst=("SST (°C)", "mean"),
            avg_ph=("pH Level", "mean"),
        )
        .reset_index()
    )
    return [
        {
            "name": row["Location"],
            "latitude": round(row["latitude"], 4),
            "longitude": round(row["longitude"], 4),
            "avg_sst": round(row["avg_sst"], 2),
            "avg_ph": round(row["avg_ph"], 3),
        }
        for _, row in loc_data.iterrows()
    ]
