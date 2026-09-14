# AGRISMART-AI — Crop Recommendation Datasets

This directory contains the Kaggle benchmark dataset and the ICAR-calibrated master dataset used to train and evaluate the Machine Learning Crop Recommendation models for AGRISMART-AI.

---

## 1. Datasets Available

| Filename | Records | Classes | Features | Provenance |
| :--- | :---: | :---: | :---: | :--- |
| **`kaggle_crop_recommendation.csv`** | 2,200 | 22 | 8 | Canonical Kaggle Benchmark (`atharvaingle/crop-recommendation-dataset`) |
| **`master_crop_recommendation.csv`** | 2,800 | 28 | 8 | Kaggle Benchmark + 6 Key Indian Staples (Wheat, Potato, Mustard, Sugarcane, Soybean, Tomato) calibrated to ICAR agro-ecological zones |

---

## 2. Feature Definitions & Measurement Units

| Feature Column | Description | Data Type | Agricultural Unit | Typical Range |
| :--- | :--- | :---: | :---: | :---: |
| `N` | Nitrogen content in soil | Continuous | $\text{kg/ha}$ (ratio) | $0 - 140$ |
| `P` | Phosphorus content in soil | Continuous | $\text{kg/ha}$ (ratio) | $5 - 145$ |
| `K` | Potassium content in soil | Continuous | $\text{kg/ha}$ (ratio) | $5 - 205$ |
| `temperature` | Average ambient air temperature | Continuous | $^\circ\text{C}$ | $8.8 - 43.7$ |
| `humidity` | Relative humidity | Continuous | $\%$ | $14.2 - 99.9$ |
| `ph` | Soil acidity / alkalinity reaction | Continuous | $\text{pH scale}$ | $3.5 - 9.9$ |
| `rainfall` | Total cumulative precipitation | Continuous | $\text{mm}$ | $20.2 - 298.6$ |
| `label` | Recommended agricultural crop | Categorical | Target class | 22 / 28 crops |

---

## 3. Supported Crops

### Kaggle Canonical Benchmark (22 Crops):
- **Cereals & Commercial:** `rice`, `maize`, `cotton`, `jute`, `coffee`
- **Legumes & Pulses:** `chickpea`, `kidneybeans`, `pigeonpeas`, `mothbeans`, `mungbean`, `blackgram`, `lentil`
- **Fruits & Plantation:** `pomegranate`, `banana`, `mango`, `grapes`, `watermelon`, `muskmelon`, `apple`, `orange`, `papaya`, `coconut`

### Calibrated Master Additions (6 Crops):
- **Winter & Food Security Staples:** `wheat` (Rabi grain), `potato` (Tuber), `mustard` (Oilseed)
- **High-Value Field Crops:** `sugarcane` (Cash crop), `soybean` (Oilseed/Legume), `tomato` (Solanaceous vegetable)

---

## 4. Automatic Downloader CLI

To verify local datasets or fetch fresh updates:
```bash
# Verify local file presence and record counts
python dataset/crop_recommendation/download_kaggle.py --verify-only

# Re-download from mirror and rebuild master dataset
python dataset/crop_recommendation/download_kaggle.py --download-all
```
