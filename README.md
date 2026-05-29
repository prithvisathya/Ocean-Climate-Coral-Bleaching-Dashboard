# Ocean Climate & Coral Bleaching Prediction Dashboard

A full-stack data science portfolio project that predicts coral bleaching severity and reef biodiversity from ocean climate observations. Built with **Python/FastAPI** (ML backend) and **React** (interactive dashboard).

![Tech Stack](https://img.shields.io/badge/Python-3.10+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green) ![React](https://img.shields.io/badge/React-18-61dafb) ![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-orange)

## Overview

This dashboard analyzes ocean climate data from seven reef regions worldwide and uses machine learning to:

- **Classify** coral bleaching severity (None → Low → Medium → High) from SST, pH, location, and marine heatwave status
- **Regress** species observed counts as a biodiversity proxy
- **Visualize** temporal trends, geographic patterns, and heatwave impacts
- **Generate** data-driven insights connecting ocean conditions to reef health

## Dataset

**File:** `data/realistic_ocean_climate_dataset.csv` (~500 observations, 2015–2024)

| Column | Description |
|--------|-------------|
| `Date` | Observation date |
| `Location` | Reef region (7 locations) |
| `Latitude` / `Longitude` | Geographic coordinates |
| `SST (°C)` | Sea surface temperature |
| `pH Level` | Ocean acidity |
| `Bleaching Severity` | Target for classification (None/Low/Medium/High) |
| `Species Observed` | Target for regression (biodiversity count) |
| `Marine Heatwave` | Boolean extreme event indicator |

## Machine Learning Pipeline

### Preprocessing
1. Parse `Date` to datetime; drop rows with missing critical values
2. Encode `Marine Heatwave` as 0/1
3. One-hot encode `Location`; standardize numeric features (SST, pH, lat, lon)
4. Label-encode `Bleaching Severity` for classification

### Models
| Task | Model | Target | Features |
|------|-------|--------|----------|
| Classification | Random Forest (100 trees) | Bleaching Severity | SST, pH, lat, lon, heatwave, location |
| Regression | Random Forest (100 trees) | Species Observed | SST, pH, lat, lon, heatwave, location |

Both models use an 80/20 train/test split. Artifacts are saved with `joblib` in `backend/models/`.

### Metrics Reported
- **Classification:** accuracy, confusion matrix, per-class precision/recall/F1
- **Regression:** MAE, RMSE, R²

## Project Structure

```
ocean-climate-dashboard/
├── backend/
│   ├── main.py              # FastAPI app & endpoints
│   ├── model.py             # ML training & inference
│   ├── data_processing.py   # Data loading, cleaning, viz JSON
│   ├── requirements.txt
│   └── models/              # Saved .joblib artifacts (generated)
├── frontend/
│   ├── src/
│   │   ├── components/      # Dashboard UI components
│   │   ├── pages/           # Dashboard page
│   │   ├── App.jsx
│   │   └── api.js           # Backend API client
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── realistic_ocean_climate_dataset.csv
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary` | Dataset overview statistics |
| POST | `/predict-bleaching` | Predict bleaching severity |
| POST | `/predict-species` | Predict species count |
| GET | `/visualizations` | Chart-ready JSON + insights |
| GET | `/model-metrics` | Model performance metrics |
| GET | `/locations` | Available locations with coordinates |

Interactive API docs: `http://localhost:8001/docs`

> **Note:** Port 8001 is used because the Vite proxy targets `8001`. Change both if needed.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup

```bash
cd ocean-climate-dashboard/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

The server starts at `http://127.0.0.1:8000`. Models are trained automatically on first startup.

To train models manually:
```bash
python model.py
```

### 2. Frontend Setup

In a new terminal:

```bash
cd ocean-climate-dashboard/frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies `/api/*` requests to the backend.

## Dashboard Features

1. **Overview Cards** — Average SST, pH, observation count, heatwave %, dominant bleaching severity
2. **Prediction Panel** — Interactive forms for bleaching and species predictions with color-coded risk levels
3. **Visualizations** — SST/pH time series, location bar charts, SST vs species scatter, heatwave comparison, lat/lon map, severity pie chart
4. **Insights** — Auto-generated ecological interpretations from statistical correlations
5. **Model Metrics** — Confusion matrix, accuracy, MAE/RMSE/R²

## Future Improvements

- [ ] Integrate real-time NOAA/NASA ocean data APIs
- [ ] Add SHAP explainability for model predictions
- [ ] Deploy with Docker Compose (backend + frontend + nginx)
- [ ] Expand to time-series forecasting (LSTM/Prophet) for SST trends
- [ ] Add geospatial map layer (Leaflet/Mapbox) for interactive reef monitoring
- [ ] Include satellite imagery overlays for bleaching detection
- [ ] A/B test Logistic Regression vs Random Forest vs XGBoost
- [ ] Add user authentication and saved prediction history

## License

MIT — free to use for portfolio and educational purposes.
