"""
Machine learning model training and persistence.

Classification: Random Forest predicts Bleaching Severity from ocean conditions.
Regression: Random Forest predicts Species Observed (biodiversity) from environment.

Both models share the same preprocessing pipeline (scaling + one-hot encoding).
Models and encoders are saved with joblib for FastAPI inference.
"""

from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from data_processing import (
    build_preprocessor,
    load_and_clean_data,
    prepare_classification_data,
    prepare_regression_data,
)

MODELS_DIR = Path(__file__).resolve().parent / "models"
CLASSIFIER_PATH = MODELS_DIR / "bleaching_classifier.joblib"
REGRESSOR_PATH = MODELS_DIR / "species_regressor.joblib"
METRICS_PATH = MODELS_DIR / "model_metrics.joblib"


def train_models(test_size: float = 0.2, random_state: int = 42) -> dict:
    """
    Train classification and regression models, evaluate on hold-out test set,
    and persist artifacts to disk.

    Returns metrics dict consumed by /model-metrics endpoint.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    df = load_and_clean_data()
    preprocessor = build_preprocessor()

    # --- Classification: Bleaching Severity ---
    X_clf, y_clf, label_encoder = prepare_classification_data(df)
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
        X_clf, y_clf, test_size=test_size, random_state=random_state, stratify=y_clf
    )

    clf_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=100,
                    max_depth=12,
                    random_state=random_state,
                    class_weight="balanced",
                ),
            ),
        ]
    )
    clf_pipeline.fit(X_train_c, y_train_c)
    y_pred_c = clf_pipeline.predict(X_test_c)

    clf_accuracy = accuracy_score(y_test_c, y_pred_c)
    all_labels = list(range(len(label_encoder.classes_)))
    clf_report = classification_report(
        y_test_c,
        y_pred_c,
        labels=all_labels,
        target_names=label_encoder.classes_,
        output_dict=True,
        zero_division=0,
    )
    clf_confusion = confusion_matrix(
        y_test_c, y_pred_c, labels=all_labels
    ).tolist()

    joblib.dump(
        {"pipeline": clf_pipeline, "label_encoder": label_encoder},
        CLASSIFIER_PATH,
    )

    # --- Regression: Species Observed ---
    X_reg, y_reg = prepare_regression_data(df)
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
        X_reg, y_reg, test_size=test_size, random_state=random_state
    )

    reg_preprocessor = build_preprocessor()
    reg_pipeline = Pipeline(
        steps=[
            ("preprocessor", reg_preprocessor),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=100,
                    max_depth=12,
                    random_state=random_state,
                ),
            ),
        ]
    )
    reg_pipeline.fit(X_train_r, y_train_r)
    y_pred_r = reg_pipeline.predict(X_test_r)

    reg_mae = mean_absolute_error(y_test_r, y_pred_r)
    reg_rmse = float(np.sqrt(mean_squared_error(y_test_r, y_pred_r)))
    reg_r2 = r2_score(y_test_r, y_pred_r)

    joblib.dump({"pipeline": reg_pipeline}, REGRESSOR_PATH)

    metrics = {
        "classification": {
            "model": "RandomForestClassifier",
            "accuracy": round(clf_accuracy, 4),
            "classification_report": clf_report,
            "confusion_matrix": clf_confusion,
            "classes": label_encoder.classes_.tolist(),
            "train_size": len(X_train_c),
            "test_size": len(X_test_c),
        },
        "regression": {
            "model": "RandomForestRegressor",
            "mae": round(reg_mae, 4),
            "rmse": round(reg_rmse, 4),
            "r2": round(reg_r2, 4),
            "train_size": len(X_train_r),
            "test_size": len(X_test_r),
        },
    }

    joblib.dump(metrics, METRICS_PATH)
    return metrics


def load_classifier():
    """Load saved bleaching severity classifier."""
    if not CLASSIFIER_PATH.exists():
        train_models()
    return joblib.load(CLASSIFIER_PATH)


def load_regressor():
    """Load saved species count regressor."""
    if not REGRESSOR_PATH.exists():
        train_models()
    return joblib.load(REGRESSOR_PATH)


def load_metrics():
    """Load cached model evaluation metrics."""
    if not METRICS_PATH.exists():
        return train_models()
    return joblib.load(METRICS_PATH)


def predict_bleaching(
    location: str,
    sst: float,
    ph: float,
    marine_heatwave: bool,
    latitude: float,
    longitude: float,
) -> dict:
    """Run inference on bleaching severity classifier."""
    artifacts = load_classifier()
    pipeline = artifacts["pipeline"]
    label_encoder = artifacts["label_encoder"]

    import pandas as pd

    input_df = pd.DataFrame(
        [
            {
                "SST (°C)": sst,
                "pH Level": ph,
                "Latitude": latitude,
                "Longitude": longitude,
                "Marine Heatwave": int(marine_heatwave),
                "Location": location,
            }
        ]
    )

    prediction_idx = pipeline.predict(input_df)[0]
    probabilities = pipeline.predict_proba(input_df)[0]
    severity = label_encoder.inverse_transform([prediction_idx])[0]

    # predict_proba columns align with classifier.classes_, not full label encoder
    classifier = pipeline.named_steps["classifier"]
    prob_map = {
        label_encoder.inverse_transform([classifier.classes_[i]])[0]: round(float(probabilities[i]), 4)
        for i in range(len(classifier.classes_))
    }

    return {
        "predicted_severity": severity,
        "probabilities": prob_map,
        "risk_level": _severity_to_risk(severity),
    }


def predict_species(
    location: str,
    sst: float,
    ph: float,
    marine_heatwave: bool,
    latitude: float,
    longitude: float,
) -> dict:
    """Run inference on species count regressor."""
    artifacts = load_regressor()
    pipeline = artifacts["pipeline"]

    import pandas as pd

    input_df = pd.DataFrame(
        [
            {
                "SST (°C)": sst,
                "pH Level": ph,
                "Latitude": latitude,
                "Longitude": longitude,
                "Marine Heatwave": int(marine_heatwave),
                "Location": location,
            }
        ]
    )

    predicted = float(pipeline.predict(input_df)[0])
    return {
        "predicted_species": round(max(0, predicted), 1),
        "interpretation": _species_interpretation(predicted),
    }


def _severity_to_risk(severity: str) -> str:
    """Map bleaching severity to color-coded risk label for frontend."""
    mapping = {
        "None": "low",
        "Low": "moderate",
        "Medium": "high",
        "High": "critical",
    }
    return mapping.get(severity, "unknown")


def _species_interpretation(count: float) -> str:
    """Provide ecological context for predicted species count."""
    if count >= 130:
        return "High biodiversity — favorable conditions for reef species."
    if count >= 100:
        return "Moderate biodiversity — typical for stressed reef ecosystems."
    return "Low biodiversity — environmental stress may be limiting species diversity."


if __name__ == "__main__":
    metrics = train_models()
    print("Training complete.")
    print(f"Classification accuracy: {metrics['classification']['accuracy']}")
    print(f"Regression R²: {metrics['regression']['r2']}")
