"""
AGRISMART-AI — Crop Recommendation Model Diagnostic Evaluator
Evaluates the serialized champion model across realistic agricultural scenarios.
"""

import os
import json
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "model", "weights", "crop_classifier.joblib")
METADATA_PATH = os.path.join(BASE_DIR, "model", "weights", "crop_metadata.json")

TEST_SCENARIOS = [
    {
        "name": "Scenario 1: High Monsoon Rainfall & High Nitrogen (Target: Rice)",
        "features": {
            "N": 90, "P": 42, "K": 43,
            "temperature": 23.5, "humidity": 82.5, "ph": 6.5, "rainfall": 235.0
        },
        "expected": "rice"
    },
    {
        "name": "Scenario 2: Cool Rabi Climate & High Nitrogen (Target: Wheat)",
        "features": {
            "N": 120, "P": 55, "K": 45,
            "temperature": 18.5, "humidity": 55.0, "ph": 6.8, "rainfall": 75.0
        },
        "expected": "wheat"
    },
    {
        "name": "Scenario 3: Semi-Arid & Low Moisture / Low Rainfall (Target: Chickpea)",
        "features": {
            "N": 40, "P": 68, "K": 79,
            "temperature": 19.5, "humidity": 16.5, "ph": 7.3, "rainfall": 78.0
        },
        "expected": "chickpea"
    },
    {
        "name": "Scenario 4: High Potassium & Moderate Climate (Target: Apple / Grapes)",
        "features": {
            "N": 25, "P": 130, "K": 200,
            "temperature": 22.5, "humidity": 92.5, "ph": 6.0, "rainfall": 110.0
        },
        "expected": "apple or grapes"
    },
    {
        "name": "Scenario 5: Humid Coastal / Tropical (Target: Coconut)",
        "features": {
            "N": 20, "P": 15, "K": 30,
            "temperature": 27.5, "humidity": 95.0, "ph": 6.0, "rainfall": 165.0
        },
        "expected": "coconut"
    }
]


def evaluate():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}")
        return

    model = joblib.load(MODEL_PATH)
    print("Loaded Champion Model:", type(model).__name__)

    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r") as f:
            meta = json.load(f)
        print(f"Champion Architecture: {meta.get('champion_classifier')}")
        print(f"Held-Out Macro-F1:     {meta.get('champion_classifier_metrics', {}).get('macro_f1')}")
        print(f"Held-Out Accuracy:     {meta.get('champion_classifier_metrics', {}).get('accuracy') * 100:.2f}%")

    print("\n" + "=" * 75)
    print("RUNNING DIAGNOSTIC TEST SCENARIOS")
    print("=" * 75)

    for sc in TEST_SCENARIOS:
        print(f"\n>> {sc['name']}")
        df_in = pd.DataFrame([sc["features"]])
        pred_crop = model.predict(df_in)[0]

        top_candidates = []
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(df_in)[0]
            classes = model.classes_
            top_idx = probs.argsort()[::-1][:4]
            for idx in top_idx:
                top_candidates.append(f"{classes[idx]} ({probs[idx] * 100:.1f}%)")

        print(f"   Input:    N={sc['features']['N']}, P={sc['features']['P']}, K={sc['features']['K']}, "
              f"T={sc['features']['temperature']}°C, H={sc['features']['humidity']}%, "
              f"pH={sc['features']['ph']}, Rain={sc['features']['rainfall']}mm")
        print(f"   Expected: {sc['expected']}")
        print(f"   ML Pick:  \033[92m{pred_crop.upper()}\033[0m")
        print(f"   Top 4:    {' | '.join(top_candidates)}")


if __name__ == "__main__":
    evaluate()
