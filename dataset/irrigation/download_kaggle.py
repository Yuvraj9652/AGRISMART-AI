"""
AGRISMART-AI Kaggle Dataset Downloader & Verification Utility.
Provides automatic or manual downloading of popular Kaggle irrigation datasets:
1. thedevastator/irrigation-water-requirement-prediction-dataset
2. arifaishal/irrigation-water-requirement-prediction-dataset
3. abdullahsajid/iot-irrigation-sensor-dataset-with-raspberry-pi
4. prateekiiest/crop-water-requirement
"""

import os
import sys
import argparse
import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")
DATASET_DIR = os.path.dirname(os.path.abspath(__file__))

RECOMMENDED_KAGGLE_DATASETS = [
    {
        "name": "CROP WATER REQUIREMENT",
        "slug": "prateekiiest/crop-water-requirement",
        "url": "https://www.kaggle.com/datasets/prateekiiest/crop-water-requirement",
        "mirror": "thedevastator/crop-water-requirement",
        "description": "Benchmark dataset mapping crop types, soil types, weather conditions and water requirement in mm/day.",
        "target_file": "kaggle_crop_water_requirement.csv"
    },
    {
        "name": "Irrigation Water Requirement Prediction Dataset",
        "slug": "arifaishal/irrigation-water-requirement-prediction-dataset",
        "url": "https://www.kaggle.com/datasets/arifaishal/irrigation-water-requirement-prediction-dataset",
        "mirror": "thedevastator/irrigation-water-requirement-prediction-dataset",
        "description": "20-attribute environmental, soil pH, moisture, evapotranspiration, and water volume regression dataset.",
        "target_file": "irrigation_water_requirement_prediction.csv"
    },
    {
        "name": "IoT Irrigation Sensor Dataset with Raspberry Pi",
        "slug": "abdullahsajid/iot-irrigation-sensor-dataset-with-raspberry-pi",
        "url": "https://www.kaggle.com/datasets/abdullahsajid/iot-irrigation-sensor-dataset-with-raspberry-pi",
        "mirror": None,
        "description": "IoT DHT11 temperature, humidity, rain detection, and capacitive soil moisture telemetry records.",
        "target_file": "iot_sensor_irrigation_data.csv"
    },
    {
        "name": "Master Multi-Crop Agronomic Field Dataset (Synthesized)",
        "slug": "agrismart/master-field-irrigation",
        "url": "Bundled with AGRISMART-AI repository",
        "mirror": None,
        "description": "5,200+ samples grounded in FAO-56 Penman-Monteith physics, soil hydraulics, and foliar pathogen interlocks.",
        "target_file": "master_irrigation_dataset.csv"
    }
]

def list_datasets():
    print("==========================================================================")
    print("🌾 AGRISMART-AI — RECOMMENDED KAGGLE IRRIGATION DATASETS")
    print("==========================================================================")
    for i, ds in enumerate(RECOMMENDED_KAGGLE_DATASETS, 1):
        path = os.path.join(DATASET_DIR, ds["target_file"])
        exists = os.path.exists(path)
        status = f"[PRESENT: {os.path.getsize(path):,} bytes]" if exists else "[NOT DOWNLOADED]"
        print(f"\n{i}. {ds['name']}")
        print(f"   Kaggle Slug : {ds['slug']}")
        print(f"   URL         : {ds['url']}")
        print(f"   Description : {ds['description']}")
        print(f"   Local File  : {ds['target_file']} -> {status}")
    print("\n--------------------------------------------------------------------------")

def verify_datasets():
    print("\n🔍 VERIFYING LOCAL IRRIGATION DATASETS:")
    print("--------------------------------------------------------------------------")
    for ds in RECOMMENDED_KAGGLE_DATASETS:
        path = os.path.join(DATASET_DIR, ds["target_file"])
        if os.path.exists(path):
            try:
                df = pd.read_csv(path)
                print(f"[OK] {ds['target_file']}: {len(df):,} rows x {len(df.columns)} columns")
                print(f"     Columns: {', '.join(df.columns[:6])}{'...' if len(df.columns) > 6 else ''}")
            except Exception as e:
                print(f"[!] Error reading {ds['target_file']}: {e}")
        else:
            print(f"[ ] {ds['target_file']}: File not found locally.")

def download_via_kaggle_api(slug, target_file):
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        print(f"[*] Downloading {slug} via official Kaggle API...")
        api.dataset_download_files(slug, path=DATASET_DIR, unzip=True)
        print(f"[OK] Successfully downloaded and unzipped {slug} to {DATASET_DIR}")
    except ImportError:
        print("[!] Kaggle Python library not installed. To use automatic Kaggle downloading:")
        print("    pip install kaggle")
        print("    Ensure your kaggle.json is placed in ~/.kaggle/kaggle.json")
    except Exception as e:
        print(f"[!] Kaggle API download failed: {e}")
        print("    You can download the dataset manually using the URL provided above.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AGRISMART-AI Kaggle Irrigation Dataset Downloader")
    parser.add_argument("--list", action="store_true", help="List recommended Kaggle datasets")
    parser.add_argument("--verify", action="store_true", help="Verify local dataset integrity")
    parser.add_argument("--download", type=str, help="Download a dataset by Kaggle slug (e.g. prateekiiest/crop-water-requirement)")
    args = parser.parse_args()

    if args.download:
        download_via_kaggle_api(args.download, "downloaded_data.csv")
    elif args.verify:
        verify_datasets()
    else:
        list_datasets()
        verify_datasets()
