"""
AGRISMART-AI Irrigation Model Evaluation & Inference Diagnostic CLI.
Loads saved champion classifier and regressor, evaluates on custom inputs,
and prints complete model diagnosis.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WEIGHTS_DIR = os.path.join(BASE_DIR, "model", "weights")

def load_models():
    clf_path = os.path.join(WEIGHTS_DIR, "irrigation_classifier.joblib")
    reg_path = os.path.join(WEIGHTS_DIR, "irrigation_regressor.joblib")
    meta_path = os.path.join(WEIGHTS_DIR, "irrigation_metadata.json")

    if not (os.path.exists(clf_path) and os.path.exists(reg_path)):
        raise FileNotFoundError("Trained weights not found. Run train_irrigation.py first.")

    clf = joblib.load(clf_path)
    reg = joblib.load(reg_path)
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    return clf, reg, meta

def run_diagnostic():
    clf, reg, meta = load_models()

    print("==========================================================================")
    print("🌾 AGRISMART-AI IRRIGATION ML MODEL DIAGNOSTIC")
    print("==========================================================================")
    print(f"Champion Classifier : {meta['champion_classifier']} (Macro-F1 = {meta['champion_classifier_metrics']['macro_f1']})")
    print(f"Champion Regressor  : {meta['champion_regressor']} (R² = {meta['champion_regressor_metrics']['r2_score']})")
    print(f"Trained On Samples  : {meta['dataset_records']:,} ({meta['train_samples']:,} train / {meta['test_samples']:,} test)")

    # Sample Test Cases
    test_cases = [
        {
            "name": "Case 1: Severe Root Drought (Tomato Vegetative, Sandy Soil)",
            "data": {
                "soil_moisture": 10.0, "temperature": 32.0, "humidity": 45.0, "forecast_rainfall_mm": 0.0,
                "crop_kc": 0.85, "reference_et0": 6.2, "crop_etc": 5.27, "effective_precipitation_peff": 0.0,
                "soil_field_capacity": 15.0, "soil_wilting_point": 6.0,
                "crop_type": "Tomato", "growth_stage": "Vegetative", "soil_type": "Sandy",
                "rain_forecast": "None", "irrigation_method": "Drip Irrigation", "disease_context": "None / Healthy"
            }
        },
        {
            "name": "Case 2: Foliar Blight Pathogen Interlock (Potato Late Blight + Sprinkler)",
            "data": {
                "soil_moisture": 18.0, "temperature": 24.0, "humidity": 82.0, "forecast_rainfall_mm": 0.0,
                "crop_kc": 1.15, "reference_et0": 4.5, "crop_etc": 5.17, "effective_precipitation_peff": 0.0,
                "soil_field_capacity": 28.0, "soil_wilting_point": 14.0,
                "crop_type": "Potato", "growth_stage": "Flowering", "soil_type": "Loamy",
                "rain_forecast": "None", "irrigation_method": "Sprinkler (Overhead)", "disease_context": "Potato Late Blight"
            }
        },
        {
            "name": "Case 3: Imminent Monsoon Rain Delay (Corn Flowering, High Rain Forecast)",
            "data": {
                "soil_moisture": 25.0, "temperature": 29.0, "humidity": 85.0, "forecast_rainfall_mm": 30.0,
                "crop_kc": 1.20, "reference_et0": 5.0, "crop_etc": 6.0, "effective_precipitation_peff": 21.5,
                "soil_field_capacity": 34.0, "soil_wilting_point": 18.0,
                "crop_type": "Corn", "growth_stage": "Flowering", "soil_type": "Clay Loam",
                "rain_forecast": "High", "irrigation_method": "Drip Irrigation", "disease_context": "None / Healthy"
            }
        },
        {
            "name": "Case 4: Soil Saturated Optimal Standby (Black Soil)",
            "data": {
                "soil_moisture": 42.0, "temperature": 27.0, "humidity": 65.0, "forecast_rainfall_mm": 0.0,
                "crop_kc": 0.75, "reference_et0": 4.2, "crop_etc": 3.15, "effective_precipitation_peff": 0.0,
                "soil_field_capacity": 40.0, "soil_wilting_point": 22.0,
                "crop_type": "Wheat", "growth_stage": "Vegetative", "soil_type": "Black Soil",
                "rain_forecast": "None", "irrigation_method": "Drip Irrigation", "disease_context": "None / Healthy"
            }
        }
    ]

    print("\n--------------------------------------------------------------------------")
    print("🔬 SIMULATING TEST SCENARIOS THROUGH DUAL-MODEL ML PIPELINE:")
    print("--------------------------------------------------------------------------")

    for tc in test_cases:
        df_input = pd.DataFrame([tc["data"]])
        pred_action = clf.predict(df_input)[0]
        pred_probs = clf.predict_proba(df_input)[0]
        class_idx = list(clf.classes_).index(pred_action)
        confidence = pred_probs[class_idx] * 100.0

        pred_water = max(0.0, float(reg.predict(df_input)[0]))

        print(f"\n{tc['name']}")
        print(f"   ► ML Predicted Action : {pred_action} ({confidence:.1f}% confidence)")
        print(f"   ► ML Water Depth      : {pred_water:.2f} mm/day ({pred_water:.2f} Liters/m²)")

    print("\n[OK] Model diagnostic completed successfully.")

if __name__ == "__main__":
    run_diagnostic()
