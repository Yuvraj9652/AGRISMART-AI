"""
AGRISMART-AI — Kaggle Crop Recommendation Dataset Ingestion & Calibrated Master Synthesis
Author: AGRISMART-AI Team
Dataset Reference: atharvaingle/crop-recommendation-dataset (Kaggle)
"""

import os
import sys
import argparse
import urllib.request
import numpy as np
import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KAGGLE_CSV_PATH = os.path.join(SCRIPT_DIR, "kaggle_crop_recommendation.csv")
MASTER_CSV_PATH = os.path.join(SCRIPT_DIR, "master_crop_recommendation.csv")

# Direct public raw mirrors of the canonical Kaggle crop-recommendation dataset
MIRROR_URLS = [
    "https://raw.githubusercontent.com/gabbygab1233/Crop-Recommender/main/Crop_recommendation.csv",
    "https://raw.githubusercontent.com/glaucia-g/Crop-Recommendation-System/main/Crop_recommendation.csv",
    "https://raw.githubusercontent.com/samratp/crop-recommendation-dataset/main/Crop_recommendation.csv"
]

# Additional 6 staple Indian agricultural crops calibrated to ICAR agronomic profiles
# (N, P, K in kg/ha; Temp in °C; Humidity in %; pH; Rainfall in mm)
STAPLE_INDIAN_CROPS = {
    "wheat": {
        "n_range": (100, 140), "p_range": (45, 65), "k_range": (35, 55),
        "temp_range": (16, 24), "humidity_range": (45, 65), "ph_range": (6.0, 7.5),
        "rainfall_range": (50, 100), "samples": 100
    },
    "potato": {
        "n_range": (120, 160), "p_range": (50, 80), "k_range": (80, 120),
        "temp_range": (15, 22), "humidity_range": (60, 80), "ph_range": (5.2, 6.8),
        "rainfall_range": (80, 150), "samples": 100
    },
    "mustard": {
        "n_range": (60, 90), "p_range": (30, 50), "k_range": (30, 50),
        "temp_range": (14, 25), "humidity_range": (40, 65), "ph_range": (6.0, 7.5),
        "rainfall_range": (30, 75), "samples": 100
    },
    "sugarcane": {
        "n_range": (150, 220), "p_range": (50, 80), "k_range": (60, 100),
        "temp_range": (26, 36), "humidity_range": (70, 90), "ph_range": (6.0, 7.8),
        "rainfall_range": (150, 250), "samples": 100
    },
    "soybean": {
        "n_range": (20, 40), "p_range": (55, 75), "k_range": (35, 55),
        "temp_range": (22, 32), "humidity_range": (60, 80), "ph_range": (6.0, 7.2),
        "rainfall_range": (120, 200), "samples": 100
    },
    "tomato": {
        "n_range": (90, 130), "p_range": (50, 70), "k_range": (50, 80),
        "temp_range": (20, 30), "humidity_range": (50, 75), "ph_range": (6.0, 7.0),
        "rainfall_range": (80, 160), "samples": 100
    }
}


def download_kaggle_dataset() -> pd.DataFrame:
    """Downloads the canonical Kaggle Crop Recommendation dataset from public mirrors."""
    print("Connecting to Kaggle Crop Recommendation dataset mirrors...")
    last_err = None
    for url in MIRROR_URLS:
        try:
            print(f"  Attempting fetch from: {url}")
            req = urllib.request.Request(url, headers={"User-Agent": "AGRISMART-AI/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read()
                df = pd.read_csv(pd.io.common.BytesIO(content))
                df.columns = [c.strip() for c in df.columns]
                # Validate columns
                expected = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall", "label"]
                if all(col in df.columns for col in expected):
                    df.to_csv(KAGGLE_CSV_PATH, index=False)
                    print(f"Successfully downloaded and saved: {KAGGLE_CSV_PATH} ({len(df)} records)")
                    return df
                else:
                    print(f"Warning: Columns mismatch: {df.columns.tolist()}")
        except Exception as e:
            last_err = e
            print(f"  Mirror failed ({e}), trying next mirror...")

    raise RuntimeError(f"All mirrors failed to download dataset. Last error: {last_err}")


def synthesize_master_dataset(df_kaggle: pd.DataFrame) -> pd.DataFrame:
    """
    Synthesizes the master 28-crop dataset by combining the 22-class Kaggle benchmark
    with 6 staple Indian crops calibrated to ICAR research standards.
    """
    np.random.seed(42)
    staple_rows = []

    for crop, cfg in STAPLE_INDIAN_CROPS.items():
        n_vals = np.random.uniform(cfg["n_range"][0], cfg["n_range"][1], cfg["samples"]).round(1)
        p_vals = np.random.uniform(cfg["p_range"][0], cfg["p_range"][1], cfg["samples"]).round(1)
        k_vals = np.random.uniform(cfg["k_range"][0], cfg["k_range"][1], cfg["samples"]).round(1)
        t_vals = np.random.uniform(cfg["temp_range"][0], cfg["temp_range"][1], cfg["samples"]).round(4)
        h_vals = np.random.uniform(cfg["humidity_range"][0], cfg["humidity_range"][1], cfg["samples"]).round(4)
        ph_vals = np.random.uniform(cfg["ph_range"][0], cfg["ph_range"][1], cfg["samples"]).round(4)
        r_vals = np.random.uniform(cfg["rainfall_range"][0], cfg["rainfall_range"][1], cfg["samples"]).round(4)

        for i in range(cfg["samples"]):
            staple_rows.append({
                "N": n_vals[i],
                "P": p_vals[i],
                "K": k_vals[i],
                "temperature": t_vals[i],
                "humidity": h_vals[i],
                "ph": ph_vals[i],
                "rainfall": r_vals[i],
                "label": crop
            })

    df_staples = pd.DataFrame(staple_rows)
    df_master = pd.concat([df_kaggle, df_staples], ignore_index=True)
    df_master.to_csv(MASTER_CSV_PATH, index=False)
    print(f"Synthesized Master Dataset: {MASTER_CSV_PATH} ({len(df_master)} records, {df_master['label'].nunique()} crops)")
    return df_master


def verify_datasets():
    """Verifies local existence and schema of both datasets."""
    print("\n--- DATASET VERIFICATION ---")
    if os.path.exists(KAGGLE_CSV_PATH):
        df_k = pd.read_csv(KAGGLE_CSV_PATH)
        print(f" Kaggle Benchmark CSV: {KAGGLE_CSV_PATH}")
        print(f"   Shape: {df_k.shape} | Unique Crops: {df_k['label'].nunique()}")
        print(f"   Crops: {sorted(df_k['label'].unique())}")
    else:
        print(f" Kaggle Benchmark CSV NOT found. Run with --download-all to fetch.")

    if os.path.exists(MASTER_CSV_PATH):
        df_m = pd.read_csv(MASTER_CSV_PATH)
        print(f"\n Master Calibrated CSV: {MASTER_CSV_PATH}")
        print(f"   Shape: {df_m.shape} | Unique Crops: {df_m['label'].nunique()}")
        print(f"   Crops: {sorted(df_m['label'].unique())}")
    else:
        print(f" Master Calibrated CSV NOT found.")


def main():
    parser = argparse.ArgumentParser(description="AGRISMART-AI Crop Recommendation Dataset Downloader & Synthesizer")
    parser.add_argument("--download-all", action="store_true", help="Download Kaggle benchmark and build master dataset")
    parser.add_argument("--verify-only", action="store_true", help="Verify existing datasets without downloading")
    args = parser.parse_args()

    if args.verify_only:
        verify_datasets()
        return

    # Default or --download-all
    df_kaggle = download_kaggle_dataset()
    synthesize_master_dataset(df_kaggle)
    verify_datasets()


if __name__ == "__main__":
    main()
