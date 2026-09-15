"""
AGRISMART-AI — Plant Disease Prediction CLI
Section 4.1 PS Requirement Compliance:
  Usage: python predict.py --image <path_to_leaf_image>
"""

import argparse
import os
import sys
import json

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from model.adapter import adapter_instance

def main():
    parser = argparse.ArgumentParser(description="AGRISMART-AI Plant Disease Predictor CLI")
    parser.add_argument("--image", required=True, help="Path to the crop/leaf image file")
    args = parser.parse_args()

    image_path = os.path.abspath(args.image)
    if not os.path.isfile(image_path):
        print(f"ERROR: Image file not found at: {image_path}")
        sys.exit(1)

    print("=" * 60)
    print("AGRISMART-AI — CROP DISEASE PREDICTION ENGINE")
    print("=" * 60)
    print(f"Target Image : {image_path}")

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        result = adapter_instance.predict(image_bytes)

        print(f"Status       : {result.get('status', 'success')}")
        print(f"Prediction   : {result.get('prediction', 'Unknown')}")
        print(f"Raw Class    : {result.get('raw_class', 'Unknown')}")
        print(f"Crop         : {result.get('crop', 'Unknown')}")
        print(f"Pathogen     : {result.get('pathogen', 'Unknown')}")
        print(f"Confidence   : {result.get('confidence_percentage', 'N/A')} ({result.get('confidence', 0)})")
        print(f"Severity     : {result.get('severity', 'Unknown')}")
        print("-" * 60)
        print("Recommended Precautions:")
        for idx, prec in enumerate(result.get("precautions", []), 1):
            print(f"  {idx}. {prec}")
        print("=" * 60)

    except Exception as e:
        print(f"ERROR: Prediction failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
