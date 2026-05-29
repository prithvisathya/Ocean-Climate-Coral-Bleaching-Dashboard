"""
Data loading and preprocessing for the Ocean Climate & Coral Bleaching dashboard.

Workflow:
1. Load CSV and parse dates
2. Clean numeric/categorical columns
3. Encode categorical features (Location, Marine Heatwave) for ML
4. Prepare feature matrices for classification (Bleaching Severity) and
   regression (Species Observed)
"""

from pathlib import Path
from typing import List

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler

# Path to dataset relative to project root
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "realistic_ocean_climate_dataset.csv"

# Ordered severity levels for aggregation and visualization
SEVERITY_ORDER = ["None", "Low", "Medium", "High"]
SEVERITY_SCORE = {"None": 0, "Low": 1, "Medium": 2, "High": 3}


def load_and_clean_data() -> pd.DataFrame:
    """Load CSV, convert Date to datetime, and handle missing values."""
    df = pd.read_csv(DATA_PATH)

    # Parse observation dates for time-series visualizations
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

    # Normalize Marine Heatwave to boolean
    if df["Marine Heatwave"].dtype == object:
        df["Marine Heatwave"] = df["Marine Heatwave"].astype(str).str.lower().map(
            {"true": True, "false": False}
        )

    # Drop rows with critical missing values
    df = df.dropna(
        subset=[
            "Date",
            "Location",
            "SST (°C)",
            "pH Level",
            "Bleaching Severity",
            "Species Observed",
            "Marine Heatwave",
        ]
    )

    # Ensure bleaching severity uses expected categories
    df["Bleaching Severity"] = df["Bleaching Severity"].astype(str).str.strip()
    df = df[df["Bleaching Severity"].isin(SEVERITY_ORDER)]

    return df.reset_index(drop=True)


def get_summary_statistics(df: pd.DataFrame) -> dict:
    """Compute dashboard overview metrics from cleaned data."""
    heatwave_pct = float(df["Marine Heatwave"].mean() * 100)
    severity_counts = df["Bleaching Severity"].value_counts()
    most_common_severity = severity_counts.idxmax()

    return {
        "avg_sst": round(float(df["SST (°C)"].mean()), 2),
        "avg_ph": round(float(df["pH Level"].mean()), 3),
        "total_observations": int(len(df)),
        "heatwave_percent": round(heatwave_pct, 1),
        "most_common_bleaching": most_common_severity,
        "locations": sorted(df["Location"].unique().tolist()),
        "severity_distribution": {
            level: int(severity_counts.get(level, 0)) for level in SEVERITY_ORDER
        },
        "date_range": {
            "start": df["Date"].min().strftime("%Y-%m-%d"),
            "end": df["Date"].max().strftime("%Y-%m-%d"),
        },
    }


def build_preprocessor() -> ColumnTransformer:
    """
    Preprocessing pipeline for both ML models.

    Numeric features (SST, pH, lat/lon) are standardized.
    Location is one-hot encoded; Marine Heatwave is treated as numeric (0/1).
    """
    numeric_features = ["SST (°C)", "pH Level", "Latitude", "Longitude", "Marine Heatwave"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("loc", OneHotEncoder(handle_unknown="ignore"), ["Location"]),
        ]
    )
    return preprocessor


def prepare_classification_data(df: pd.DataFrame):
    """
    Prepare X/y for bleaching severity classification.

    Target: Bleaching Severity (None, Low, Medium, High)
    Features: SST, pH, coordinates, marine heatwave, location
    """
    feature_cols = [
        "SST (°C)",
        "pH Level",
        "Latitude",
        "Longitude",
        "Marine Heatwave",
        "Location",
    ]
    X = df[feature_cols].copy()
    X["Marine Heatwave"] = X["Marine Heatwave"].astype(int)

    label_encoder = LabelEncoder()
    # Fit on classes actually present in the dataset (may be subset of SEVERITY_ORDER)
    present_severities = [s for s in SEVERITY_ORDER if s in df["Bleaching Severity"].unique()]
    label_encoder.fit(present_severities)
    y = label_encoder.transform(df["Bleaching Severity"])

    return X, y, label_encoder


def prepare_regression_data(df: pd.DataFrame):
    """
    Prepare X/y for species count regression.

    Target: Species Observed (biodiversity proxy)
    Features: SST, pH, marine heatwave, location, coordinates
    """
    feature_cols = [
        "SST (°C)",
        "pH Level",
        "Latitude",
        "Longitude",
        "Marine Heatwave",
        "Location",
    ]
    X = df[feature_cols].copy()
    X["Marine Heatwave"] = X["Marine Heatwave"].astype(int)
    y = df["Species Observed"].values
    return X, y


def generate_insights(df: pd.DataFrame) -> List[dict]:
    """
    Derive data-driven insights linking ocean conditions to bleaching risk.

    These power the frontend Insights section and connect visualizations
    to ecological interpretation.
    """
    insights = []

    # SST vs bleaching: higher temperatures correlate with worse bleaching
    df_scored = df.copy()
    df_scored["severity_score"] = df_scored["Bleaching Severity"].map(SEVERITY_SCORE)
    sst_corr = df_scored["SST (°C)"].corr(df_scored["severity_score"])
    if sst_corr > 0.1:
        insights.append(
            {
                "title": "Temperature & Bleaching",
                "text": f"Higher sea surface temperature is associated with increased bleaching severity "
                f"(correlation: {sst_corr:.2f}). Warm water stresses coral symbionts.",
                "type": "warning",
            }
        )

    # Marine heatwave impact
    heatwave_severity = (
        df.groupby("Marine Heatwave")["Bleaching Severity"]
        .apply(lambda s: s.map(SEVERITY_SCORE).mean())
        .to_dict()
    )
    if True in heatwave_severity and False in heatwave_severity:
        diff = heatwave_severity[True] - heatwave_severity[False]
        if diff > 0:
            insights.append(
                {
                    "title": "Marine Heatwaves",
                    "text": f"Observations during marine heatwaves show {diff:.1f} points higher average "
                    "bleaching severity on a 0–3 scale.",
                    "type": "danger",
                }
            )

    # pH vs biodiversity
    ph_species_corr = df["pH Level"].corr(df["Species Observed"])
    if ph_species_corr > 0:
        insights.append(
            {
                "title": "pH & Biodiversity",
                "text": f"Higher pH levels correlate with greater species counts (r={ph_species_corr:.2f}), "
                "suggesting ocean acidification may reduce reef biodiversity.",
                "type": "info",
            }
        )
    else:
        insights.append(
            {
                "title": "pH & Biodiversity",
                "text": f"Lower pH may correlate with reduced biodiversity (r={ph_species_corr:.2f}). "
                "Acidic conditions stress calcifying organisms.",
                "type": "info",
            }
        )

    # Location-level SST and bleaching patterns
    loc_stats = (
        df.groupby("Location")
        .agg(avg_sst=("SST (°C)", "mean"), avg_severity=("Bleaching Severity", lambda s: s.map(SEVERITY_SCORE).mean()))
        .sort_values("avg_sst", ascending=False)
    )
    hottest = loc_stats.index[0]
    hottest_sst = loc_stats.iloc[0]["avg_sst"]
    hottest_sev = loc_stats.iloc[0]["avg_severity"]
    insights.append(
        {
            "title": "Regional Patterns",
            "text": f"{hottest} has the highest average SST ({hottest_sst:.1f}°C) and elevated bleaching "
            f"(severity score {hottest_sev:.2f}/3). Regional warming drives localized reef stress.",
            "type": "warning",
        }
    )

    return insights


def build_visualization_data(df: pd.DataFrame) -> dict:
    """
    Aggregate chart-ready JSON for frontend visualizations.

    Each dataset connects to coral bleaching risk interpretation:
    - SST/pH trends: environmental stress over time
    - Location bars: geographic vulnerability
    - Scatter: temperature vs biodiversity trade-offs
    - Heatwave comparison: extreme event impact
    - Map points: spatial distribution of observations
    - Severity distribution: overall reef health snapshot
    """
    # Time series: monthly averages smooth weekly noise
    monthly = (
        df.set_index("Date")
        .resample("ME")
        .agg({"SST (°C)": "mean", "pH Level": "mean"})
        .reset_index()
    )
    sst_over_time = [
        {"date": row["Date"].strftime("%Y-%m"), "sst": round(row["SST (°C)"], 2)}
        for _, row in monthly.iterrows()
    ]
    ph_over_time = [
        {"date": row["Date"].strftime("%Y-%m"), "ph": round(row["pH Level"], 3)}
        for _, row in monthly.iterrows()
    ]

    # Average bleaching severity by location (numeric score for bar chart)
    loc_severity = (
        df.groupby("Location")["Bleaching Severity"]
        .apply(lambda s: round(s.map(SEVERITY_SCORE).mean(), 2))
        .reset_index(name="avg_severity")
    )
    bleaching_by_location = [
        {"location": row["Location"], "avg_severity": row["avg_severity"]}
        for _, row in loc_severity.iterrows()
    ]

    # SST vs species scatter — shows thermal stress vs biodiversity
    sst_vs_species = [
        {
            "sst": round(row["SST (°C)"], 2),
            "species": int(row["Species Observed"]),
            "location": row["Location"],
        }
        for _, row in df.iterrows()
    ]

    # Heatwave vs bleaching severity comparison
    heatwave_comparison = []
    for hw in [False, True]:
        subset = df[df["Marine Heatwave"] == hw]
        counts = subset["Bleaching Severity"].value_counts()
        heatwave_comparison.append(
            {
                "heatwave": "During Heatwave" if hw else "No Heatwave",
                "None": int(counts.get("None", 0)),
                "Low": int(counts.get("Low", 0)),
                "Medium": int(counts.get("Medium", 0)),
                "High": int(counts.get("High", 0)),
            }
        )

    # Map-style scatter using lat/lon with severity color coding
    map_points = [
        {
            "lat": round(row["Latitude"], 4),
            "lon": round(row["Longitude"], 4),
            "location": row["Location"],
            "severity": row["Bleaching Severity"],
            "sst": round(row["SST (°C)"], 2),
        }
        for _, row in df.iterrows()
    ]

    # Bleaching severity distribution
    severity_dist = df["Bleaching Severity"].value_counts()
    severity_distribution = [
        {"severity": level, "count": int(severity_dist.get(level, 0))}
        for level in SEVERITY_ORDER
    ]

    return {
        "sst_over_time": sst_over_time,
        "ph_over_time": ph_over_time,
        "bleaching_by_location": bleaching_by_location,
        "sst_vs_species": sst_vs_species,
        "heatwave_comparison": heatwave_comparison,
        "map_points": map_points,
        "severity_distribution": severity_distribution,
    }
