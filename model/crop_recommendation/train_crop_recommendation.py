"""
AGRISMART-AI — Crop Recommendation Machine Learning Training & Benchmarking Pipeline
Author: AGRISMART-AI Team
Evaluates 5 Classifier Architectures on Kaggle & Calibrated Agricultural Benchmark
"""

import os
import sys
import time
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

# Ensure Windows stdout handles utf-8 cleanly
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    classification_report,
    confusion_matrix
)
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier
)
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "crop_recommendation", "master_crop_recommendation.csv")
KAGGLE_PATH = os.path.join(BASE_DIR, "dataset", "crop_recommendation", "kaggle_crop_recommendation.csv")
WEIGHTS_DIR = os.path.join(BASE_DIR, "model", "weights")
MODEL_SAVE_PATH = os.path.join(WEIGHTS_DIR, "crop_classifier.joblib")
METADATA_SAVE_PATH = os.path.join(WEIGHTS_DIR, "crop_metadata.json")

FEATURE_NAMES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
FEATURE_DISPLAY_NAMES = {
    "N": "Soil Nitrogen (N)",
    "P": "Soil Phosphorus (P)",
    "K": "Soil Potassium (K)",
    "temperature": "Ambient Temperature (°C)",
    "humidity": "Relative Humidity (%)",
    "ph": "Soil Reaction (pH)",
    "rainfall": "Rainfall Influx (mm)"
}


def load_dataset() -> pd.DataFrame:
    """Loads the master dataset, falling back to Kaggle benchmark if master is missing."""
    if os.path.exists(DATASET_PATH):
        print(f"Loading Master Calibrated Dataset: {DATASET_PATH}")
        df = pd.read_csv(DATASET_PATH)
    elif os.path.exists(KAGGLE_PATH):
        print(f"Loading Kaggle Benchmark Dataset: {KAGGLE_PATH}")
        df = pd.read_csv(KAGGLE_PATH)
    else:
        raise FileNotFoundError("No crop recommendation dataset found. Run download_kaggle.py first.")
    
    print(f"Dataset Shape: {df.shape} | Unique Crops: {df['label'].nunique()}")
    return df


def benchmark_classifiers(X_train, X_test, y_train, y_test, cv_kfold):
    """Trains and benchmarks 5 multi-class classification architectures."""
    models = {
        "Random Forest Classifier": RandomForestClassifier(
            n_estimators=150,
            max_depth=16,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1
        ),
        "Gradient Boosting Classifier": GradientBoostingClassifier(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        ),
        "Extra Trees Classifier": ExtraTreesClassifier(
            n_estimators=150,
            max_depth=16,
            random_state=42,
            n_jobs=-1
        ),
        "Support Vector Classifier (RBF)": Pipeline([
            ("scaler", StandardScaler()),
            ("svc", SVC(C=10.0, kernel="rbf", probability=True, random_state=42))
        ]),
        "Gaussian Naive Bayes (Baseline)": GaussianNB()
    }

    results = {}
    fitted_models = {}

    print("\n--- CLASSIFIER BENCHMARKING (80/20 Stratified Split + 5-Fold CV) ---")
    for name, model in models.items():
        print(f"\nTraining [{name}]...")
        t0 = time.time()
        
        # 5-Fold Stratified Cross Validation on Train Set
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv_kfold, scoring="f1_macro", n_jobs=-1)
        
        # Fit on full training set
        model.fit(X_train, y_train)
        fit_time = round(time.time() - t0, 3)
        fitted_models[name] = model

        # Evaluate on held-out test set
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        f1_macro = f1_score(y_test, y_pred, average="macro")
        prec_macro = precision_score(y_test, y_pred, average="macro", zero_division=0)
        rec_macro = recall_score(y_test, y_pred, average="macro")

        print(f"  Test Accuracy:     {acc * 100:.2f}%")
        print(f"  Test Macro-F1:     {f1_macro:.4f}")
        print(f"  5-Fold CV F1-Mean: {cv_scores.mean():.4f} (± {cv_scores.std():.4f})")
        print(f"  Training Time:     {fit_time}s")

        results[name] = {
            "accuracy": round(float(acc), 4),
            "macro_f1": round(float(f1_macro), 4),
            "macro_precision": round(float(prec_macro), 4),
            "macro_recall": round(float(rec_macro), 4),
            "cv_f1_mean": round(float(cv_scores.mean()), 4),
            "cv_f1_std": round(float(cv_scores.std()), 4),
            "fit_time_seconds": fit_time
        }

    return results, fitted_models


def extract_feature_importances(model, feature_names) -> dict:
    """Extracts normalized percentage feature importances."""
    if hasattr(model, "feature_importances_"):
        raw_imp = model.feature_importances_
    elif hasattr(model, "named_steps") and hasattr(model.named_steps.get("svc"), "feature_importances_"):
        raw_imp = model.named_steps["svc"].feature_importances_
    else:
        # Fallback uniform
        raw_imp = np.ones(len(feature_names)) / len(feature_names)
    
    total = sum(raw_imp)
    percentages = {fname: round(float((val / total) * 100.0), 2) for fname, val in zip(feature_names, raw_imp)}
    # Sort descending
    return dict(sorted(percentages.items(), key=lambda item: item[1], reverse=True))


def main():
    print("=" * 70)
    print("AGRISMART-AI: CROP RECOMMENDATION MULTI-MODEL ML PIPELINE")
    print("=" * 70)

    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    df = load_dataset()

    X = df[FEATURE_NAMES]
    y = df["label"].str.lower().str.strip()
    classes = sorted(y.unique().tolist())
    print(f"Target Classes ({len(classes)}): {classes}")

    # Honest 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train Samples: {len(X_train)} | Held-Out Test Samples: {len(X_test)}")

    cv_kfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Benchmark All Classifiers
    benchmarks, fitted_models = benchmark_classifiers(X_train, X_test, y_train, y_test, cv_kfold)

    # Select Champion Model (Ranked by Test Macro-F1, then CV F1)
    champion_name = max(
        benchmarks.keys(),
        key=lambda k: (benchmarks[k]["macro_f1"], benchmarks[k]["cv_f1_mean"])
    )
    champion_model = fitted_models[champion_name]
    champion_metrics = benchmarks[champion_name]

    print("\n" + "=" * 70)
    print(f"[CHAMPION] MODEL SELECTED: {champion_name}")
    print(f"   Held-Out Accuracy: {champion_metrics['accuracy'] * 100:.2f}%")
    print(f"   Held-Out Macro-F1: {champion_metrics['macro_f1']:.4f}")
    print(f"   5-Fold CV F1:     {champion_metrics['cv_f1_mean']:.4f}")
    print("=" * 70)

    # Detailed Per-Class Classification Report
    y_pred_champ = champion_model.predict(X_test)
    class_report_dict = classification_report(y_test, y_pred_champ, output_dict=True, zero_division=0)
    print("\nPer-Class Classification Report (Test Set):")
    print(classification_report(y_test, y_pred_champ, zero_division=0))

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred_champ, labels=classes)
    cm_dict = {
        "classes": classes,
        "matrix": cm.tolist()
    }

    # Feature Importances
    feat_importances = extract_feature_importances(champion_model, FEATURE_NAMES)
    print("\nFeature Importances:")
    for feat, imp in feat_importances.items():
        print(f"  {FEATURE_DISPLAY_NAMES.get(feat, feat):<30}: {imp:>6.2f}%")

    # Serialize Champion Model
    joblib.dump(champion_model, MODEL_SAVE_PATH)
    print(f"\nSaved Champion Model: {MODEL_SAVE_PATH}")

    # Build Metadata Payload
    metadata = {
        "status": "success",
        "champion_classifier": champion_name,
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "dataset_records": int(len(df)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "number_of_crops": int(len(classes)),
        "supported_crops": classes,
        "feature_names": FEATURE_NAMES,
        "champion_classifier_metrics": champion_metrics,
        "classifier_benchmarks": benchmarks,
        "per_class_metrics": {
            cls: {
                "precision": round(class_report_dict[cls]["precision"], 4),
                "recall": round(class_report_dict[cls]["recall"], 4),
                "f1_score": round(class_report_dict[cls]["f1-score"], 4),
                "support": class_report_dict[cls]["support"]
            }
            for cls in classes if cls in class_report_dict
        },
        "confusion_matrix": cm_dict,
        "feature_importances": feat_importances
    }

    with open(METADATA_SAVE_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved Benchmark Metadata: {METADATA_SAVE_PATH}")
    print("\nCrop Recommendation ML Training Complete!")


if __name__ == "__main__":
    main()
