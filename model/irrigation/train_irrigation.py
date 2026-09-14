"""
AGRISMART-AI Smart Irrigation Machine Learning Training Pipeline.
Trains dual ML models:
1. Multi-Class Decision Classifier (Action & Urgency)
2. Precision Water Requirement Regressor (Depth mm / L/m²)
Benchmarks multiple architectures and serializes the champion models.
"""

import os
import sys
import json
import time
from datetime import datetime
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix,
    classification_report,
    r2_score,
    mean_absolute_error,
    mean_squared_error
)

from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier,
    RandomForestRegressor,
    GradientBoostingRegressor
)
from sklearn.linear_model import LogisticRegression, Ridge

sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "irrigation", "master_irrigation_dataset.csv")
WEIGHTS_DIR = os.path.join(BASE_DIR, "model", "weights")
os.makedirs(WEIGHTS_DIR, exist_ok=True)

# Feature specifications
NUMERICAL_FEATURES = [
    "soil_moisture",
    "temperature",
    "humidity",
    "forecast_rainfall_mm",
    "crop_kc",
    "reference_et0",
    "crop_etc",
    "effective_precipitation_peff",
    "soil_field_capacity",
    "soil_wilting_point"
]

CATEGORICAL_FEATURES = [
    "crop_type",
    "growth_stage",
    "soil_type",
    "rain_forecast",
    "irrigation_method",
    "disease_context"
]

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

def load_and_split_data():
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Run build_datasets.py first.")
    
    df = pd.read_csv(DATASET_PATH)
    print(f"[*] Loaded dataset: {len(df):,} records, {len(df.columns)} columns")

    X = df[ALL_FEATURES]
    y_clf = df["action_code"]
    y_reg = df["water_requirement_mm"]

    # Stratified 80/20 train/test split based on classification labels
    X_train, X_test, y_clf_train, y_clf_test, y_reg_train, y_reg_test = train_test_split(
        X, y_clf, y_reg, test_size=0.20, random_state=42, stratify=y_clf
    )

    print(f"[*] Split: Train={len(X_train):,} samples, Held-out Test={len(X_test):,} samples (80/20 honest split)")
    return X_train, X_test, y_clf_train, y_clf_test, y_reg_train, y_reg_test

def build_preprocessor():
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )
    return preprocessor

def train_and_benchmark_classifiers(X_train, X_test, y_train, y_test):
    print("\n==========================================================================")
    print("🤖 1. BENCHMARKING CLASSIFICATION MODELS (IRRIGATION ACTION DECISION)")
    print("==========================================================================")

    candidate_models = {
        "Random Forest Classifier": RandomForestClassifier(n_estimators=120, max_depth=16, random_state=42, n_jobs=-1),
        "Gradient Boosting Classifier": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42),
        "Extra Trees Classifier": ExtraTreesClassifier(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1),
        "Logistic Regression (Baseline)": LogisticRegression(max_iter=1000, random_state=42)
    }

    benchmark_results = {}
    best_f1 = -1.0
    champion_name = None
    champion_pipeline = None

    for name, model in candidate_models.items():
        pipeline = Pipeline([
            ("preprocessor", build_preprocessor()),
            ("classifier", model)
        ])

        start_t = time.time()
        pipeline.fit(X_train, y_train)
        fit_duration = time.time() - start_t

        y_pred = pipeline.predict(X_test)

        acc = accuracy_score(y_test, y_pred)
        macro_f1 = f1_score(y_test, y_pred, average="macro")
        macro_prec = precision_score(y_test, y_pred, average="macro", zero_division=0)
        macro_rec = recall_score(y_test, y_pred, average="macro", zero_division=0)

        # 5-fold cross validation
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="f1_macro", n_jobs=-1)
        mean_cv = float(np.mean(cv_scores))

        benchmark_results[name] = {
            "accuracy": round(float(acc), 4),
            "macro_f1": round(float(macro_f1), 4),
            "macro_precision": round(float(macro_prec), 4),
            "macro_recall": round(float(macro_rec), 4),
            "cv_f1_mean": round(mean_cv, 4),
            "fit_time_seconds": round(fit_duration, 3)
        }

        print(f"-> {name:<30} | Acc: {acc*100:.2f}% | Macro-F1: {macro_f1:.4f} | CV-F1: {mean_cv:.4f} | Time: {fit_duration:.2f}s")

        if macro_f1 > best_f1:
            best_f1 = macro_f1
            champion_name = name
            champion_pipeline = pipeline

    print(f"\n[🏆] CHAMPION CLASSIFIER: {champion_name} (Macro-F1 = {best_f1:.4f})")

    # Detailed report on held-out test
    y_pred_best = champion_pipeline.predict(X_test)
    classes = np.unique(y_test)
    cm = confusion_matrix(y_test, y_pred_best, labels=classes)
    report_dict = classification_report(y_test, y_pred_best, output_dict=True, zero_division=0)

    print("\nPer-Class Performance on Held-Out Test Set:")
    for cls_name in classes:
        metrics = report_dict[cls_name]
        print(f"   {cls_name:<26} | P: {metrics['precision']:.3f} | R: {metrics['recall']:.3f} | F1: {metrics['f1-score']:.3f} (n={metrics['support']})")

    return champion_pipeline, champion_name, benchmark_results, cm, classes.tolist(), report_dict

def train_and_benchmark_regressors(X_train, X_test, y_train, y_test):
    print("\n==========================================================================")
    print("💧 2. BENCHMARKING REGRESSION MODELS (PRECISION WATER REQUIREMENT MM)")
    print("==========================================================================")

    candidate_models = {
        "Random Forest Regressor": RandomForestRegressor(n_estimators=120, max_depth=16, random_state=42, n_jobs=-1),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42),
        "Ridge Regression (Baseline)": Ridge(alpha=1.0)
    }

    benchmark_results = {}
    best_r2 = -10.0
    champion_name = None
    champion_pipeline = None

    for name, model in candidate_models.items():
        pipeline = Pipeline([
            ("preprocessor", build_preprocessor()),
            ("regressor", model)
        ])

        start_t = time.time()
        pipeline.fit(X_train, y_train)
        fit_duration = time.time() - start_t

        y_pred = pipeline.predict(X_test)

        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        benchmark_results[name] = {
            "r2_score": round(float(r2), 4),
            "mae_mm": round(float(mae), 4),
            "rmse_mm": round(float(rmse), 4),
            "fit_time_seconds": round(fit_duration, 3)
        }

        print(f"-> {name:<30} | R²: {r2:.4f} | MAE: {mae:.3f} mm | RMSE: {rmse:.3f} mm | Time: {fit_duration:.2f}s")

        if r2 > best_r2:
            best_r2 = r2
            champion_name = name
            champion_pipeline = pipeline

    print(f"\n[🏆] CHAMPION REGRESSOR: {champion_name} (R² = {best_r2:.4f})")
    return champion_pipeline, champion_name, benchmark_results

def extract_feature_importances(champion_pipeline):
    try:
        preprocessor = champion_pipeline.named_steps["preprocessor"]
        cat_encoder = preprocessor.named_transformers_["cat"]
        cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
        feature_names = NUMERICAL_FEATURES + cat_feature_names

        model = champion_pipeline.named_steps.get("classifier") or champion_pipeline.named_steps.get("regressor")
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            # Aggregate one-hot categories back to parent features for farmer interpretability
            agg_importances = {feat: 0.0 for feat in ALL_FEATURES}
            for name, imp in zip(feature_names, importances):
                matched = False
                for cat_f in CATEGORICAL_FEATURES:
                    if name.startswith(cat_f):
                        agg_importances[cat_f] += float(imp)
                        matched = True
                        break
                if not matched and name in agg_importances:
                    agg_importances[name] += float(imp)

            # Normalize to percentages
            total = sum(agg_importances.values()) or 1.0
            norm_importances = {k: round((v / total) * 100.0, 2) for k, v in agg_importances.items()}
            sorted_imp = dict(sorted(norm_importances.items(), key=lambda item: item[1], reverse=True))
            return sorted_imp
    except Exception as e:
        print(f"[!] Could not extract feature importances: {e}")
    return {}

def main():
    X_train, X_test, y_clf_train, y_clf_test, y_reg_train, y_reg_test = load_and_split_data()

    # 1. Train Classifier
    champion_clf, clf_name, clf_benchmarks, cm, classes, report = train_and_benchmark_classifiers(
        X_train, X_test, y_clf_train, y_clf_test
    )

    # 2. Train Regressor
    champion_reg, reg_name, reg_benchmarks = train_and_benchmark_regressors(
        X_train, X_test, y_reg_train, y_reg_test
    )

    # 3. Extract Feature Importances
    clf_importances = extract_feature_importances(champion_clf)
    reg_importances = extract_feature_importances(champion_reg)

    print("\nTop 5 Drivers of Smart Irrigation Decisions (XAI Feature Importance):")
    for k, v in list(clf_importances.items())[:5]:
        print(f"   * {k:<25}: {v}%")

    # 4. Save Weights
    clf_path = os.path.join(WEIGHTS_DIR, "irrigation_classifier.joblib")
    reg_path = os.path.join(WEIGHTS_DIR, "irrigation_regressor.joblib")
    meta_path = os.path.join(WEIGHTS_DIR, "irrigation_metadata.json")

    print(f"\n[*] Saving champion classifier to {clf_path}...")
    joblib.dump(champion_clf, clf_path)

    print(f"[*] Saving champion regressor to {reg_path}...")
    joblib.dump(champion_reg, reg_path)

    # Prepare metadata
    metadata = {
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "champion_classifier": clf_name,
        "champion_regressor": reg_name,
        "dataset_records": len(X_train) + len(X_test),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classifier_benchmarks": clf_benchmarks,
        "regressor_benchmarks": reg_benchmarks,
        "champion_classifier_metrics": {
            "macro_f1": clf_benchmarks[clf_name]["macro_f1"],
            "accuracy": clf_benchmarks[clf_name]["accuracy"],
            "precision": clf_benchmarks[clf_name]["macro_precision"],
            "recall": clf_benchmarks[clf_name]["macro_recall"]
        },
        "champion_regressor_metrics": {
            "r2_score": reg_benchmarks[reg_name]["r2_score"],
            "mae_mm": reg_benchmarks[reg_name]["mae_mm"],
            "rmse_mm": reg_benchmarks[reg_name]["rmse_mm"]
        },
        "confusion_matrix": {
            "classes": classes,
            "matrix": cm.tolist()
        },
        "classification_report": report,
        "classifier_feature_importances": clf_importances,
        "regressor_feature_importances": reg_importances,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "supported_crops": ["Tomato", "Potato", "Pepper Bell", "Corn", "Wheat", "Cotton", "Soybean", "Rice", "Sugarcane"]
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Saved model metadata and benchmarking report to {meta_path}")
    print("\n==========================================================================")
    print("✅ AGRISMART-AI SMART IRRIGATION MACHINE LEARNING ENGINE SUCCESSFULLY TRAINED!")
    print("==========================================================================")

if __name__ == "__main__":
    main()
