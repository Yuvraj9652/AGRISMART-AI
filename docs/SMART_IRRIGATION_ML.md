# AGRISMART-AI — Smart Irrigation & Spore Suppression ML Engine

> **Module Specification & Architecture Alignment**  
> Compliant with [AGRISMART_AI_Architecture.docx Section 9 (Decision-Engine Advisory) & Section 10 (Smart Irrigation Engine)](file:///b:/sih_internal/AGRISMART-AI/AGRISMART_AI_Architecture.docx).

---

## 1. Overview

AGRISMART-AI features a dual-engine **Physics-Informed Machine Learning (PIML)** Smart Irrigation suite. It dynamically bridges crop disease diagnostics with irrigation actuation:
1. **Foliar Pathogen Spore Suppression Interlock**: If the disease vision model detects foliar pathogens (e.g., *Tomato Early Blight*, *Potato Late Blight*, *Leaf Mold*), overhead sprinkler watering is immediately halted in software to prevent leaf wetness and fungal conidia/zoospore splash dispersal. The engine routes water exclusively through calibrated root-zone drip lines.
2. **Dual-Model ML Pipeline**:
   - **Champion Classifier**: Gradient Boosting Classifier predicting agronomic action code (`IRRIGATE_IMMEDIATELY`, `SUSPEND_OVERHEAD_BLIGHT`, `MAINTENANCE_DRIP`, `DELAY_RAIN_EXPECTED`, `OPTIMAL_STANDBY`) with **99.71% Accuracy** and **0.9970 Held-Out Macro-F1**.
   - **Champion Regressor**: Random Forest Regressor predicting net irrigation depth (mm) with **$R^2 = 0.9275$** and **MAE = 0.234 mm**.
3. **IoT Relay Telemetry**: Generates deterministic actuator control payloads (`motor_relay_state`, `duration_minutes`, `target_flow_liters`, `lockout_active`) consumable by ESP32 / Arduino LoRa solenoids.

---

## 2. Dataset Provenance & Synthesis

The models were trained, cross-validated, and tested on a curated dataset comprising:

| Dataset Component | Records | Features | Source / Benchmark |
| :--- | :---: | :--- | :--- |
| **Kaggle Crop Water Requirement** | 768 | Crop type, soil texture, growth stage, temperature, humidity, water req | [Kaggle: prateekiiest/crop-water-requirement](https://www.kaggle.com/datasets/prateekiiest/crop-water-requirement) |
| **IoT Sensor Telemetry Benchmark** | 1,007 | Soil capacitive moisture, ambient temp, relative humidity, motor trigger | Kaggle open IoT smart farm sensor logs |
| **Calibrated Master PIML Dataset** | 5,200 | 16 features (FAO-56 ET0, ETc, MAD thresholds, rain forecast, disease context) | [dataset/irrigation/master_irrigation_dataset.csv](file:///b:/sih_internal/AGRISMART-AI/dataset/irrigation/master_irrigation_dataset.csv) |

### Automatic Kaggle Downloader
A dedicated CLI script [dataset/irrigation/download_kaggle.py](file:///b:/sih_internal/AGRISMART-AI/dataset/irrigation/download_kaggle.py) is provided to verify local CSVs or pull the latest raw datasets via the Kaggle API:
```bash
python dataset/irrigation/download_kaggle.py --verify-only
# Or with Kaggle API credentials:
python dataset/irrigation/download_kaggle.py --download-all
```

---

## 3. Model Architecture & Benchmarking Results

Four classification algorithms and three regression architectures were evaluated under an **80/20 honest train/test split** (4,160 train samples, 1,040 held-out test samples) with 5-fold Stratified Cross-Validation:

### Classifier Comparison (Action Code Prediction)

| Model Architecture | Accuracy | Macro-F1 | Macro-Precision | Macro-Recall | 5-Fold CV F1 | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Gradient Boosting Classifier** | **99.71%** | **0.9970** | **0.9977** | **0.9963** | **0.9977** | 🏆 **Champion** |
| Random Forest Classifier | 93.17% | 0.9347 | 0.9290 | 0.9419 | 0.9243 | Evaluated |
| Logistic Regression (Baseline) | 94.04% | 0.9433 | 0.9458 | 0.9420 | 0.9390 | Baseline |
| Extra Trees Classifier | 80.67% | 0.8349 | 0.8315 | 0.8427 | 0.8544 | Evaluated |

### Regressor Comparison (Net Water Depth in mm)

| Model Architecture | $R^2$ Score | MAE (mm) | RMSE (mm) | Training Fit Time | Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Random Forest Regressor** | **0.9275** | **0.2341 mm** | **0.5583 mm** | 0.66 s | 🏆 **Champion** |
| Gradient Boosting Regressor | 0.9258 | 0.3808 mm | 0.5647 mm | 1.57 s | Evaluated |
| Ridge Regression (Baseline) | 0.6016 | 1.0463 mm | 1.3089 mm | 0.03 s | Baseline |

### Held-Out Test Set Per-Class Classification Report
```
                         precision    recall  f1-score   support
    DELAY_RAIN_EXPECTED     1.0000    0.9816    0.9907       163
    IRRIGATE_IMMEDIATELY     1.0000    1.0000    1.0000       283
       MAINTENANCE_DRIP     0.9883    1.0000    0.9941       253
        OPTIMAL_STANDBY     1.0000    1.0000    1.0000       274
SUSPEND_OVERHEAD_BLIGHT     1.0000    1.0000    1.0000        67
               accuracy                         0.9971      1040
              macro avg     0.9977    0.9963    0.9970      1040
           weighted avg     0.9971    0.9971    0.9971      1040
```

---

## 4. Explainable AI (XAI) Feature Importance

The champion models prioritize physically grounded agronomic drivers rather than spurious correlations:

| Rank | Feature Name | Relative Importance (%) | Physical Agronomic Role |
| :---: | :--- | :---: | :--- |
| 1 | `soil_moisture` | **39.19%** | Real-time volumetric moisture reading from capacitive probe |
| 2 | `effective_precipitation_peff` | **18.36%** | Rain that infiltrates the root zone rather than running off |
| 3 | `soil_field_capacity` | **11.52%** | Upper soil moisture retention limit preventing waterlogging |
| 4 | `disease_context` | **10.48%** | Foliar pathogen diagnosis driving spore suppression lockout |
| 5 | `soil_wilting_point` | **7.94%** | Permanent wilting point threshold where plants desiccate |
| 6 | `soil_type` | **5.82%** | Soil hydraulic conductivity and infiltration rate |
| 7 | `irrigation_method` | **3.38%** | Application efficiency (Drip 90%, Sprinkler 70%, Flood 50%) |
| 8 | `forecast_rainfall_mm` | **2.91%** | 24-hour meteorological rain accumulation |

---

## 5. Spore Suppression Safety Interlock Mechanism

In traditional smart irrigation systems, low soil moisture triggers sprinklers automatically, causing devastating secondary infections if blight is present.

### The Problem
*Phytophthora infestans* (Late Blight) and *Alternaria solani* (Early Blight) thrive under free moisture on leaf surfaces. Overhead sprinkler droplets physically disperse zoospores across adjacent plants and provide the leaf wetness duration (6–8 hours) necessary for germ tube penetration.

### The AGRISMART-AI Solution
Section 10 of the architecture requires the disease vision system to pass diagnostic tags into the irrigation engine:
```python
has_active_disease = any(kw in disease_ctx.lower() for kw in ["blight", "spot", "mold", "mildew", "virus"])
is_sprinkler = "sprinkler" in irr_method.lower() or "overhead" in irr_method.lower()

if has_active_disease and is_sprinkler:
    action_code = "SUSPEND_OVERHEAD_BLIGHT"
    iot_payload = {
        "motor_relay_state": 0,
        "duration_minutes": 0,
        "target_flow_liters": 0.0,
        "lockout_active": True
    }
```
When triggered:
- Overhead sprinkler relays are **locked out (`lockout_active: True`)**.
- The farmer is alerted to divert irrigation strictly through root-zone drip lines.
- The canopy remains completely dry, arresting spore proliferation.

---

## 6. REST API Endpoints

### 1. `POST /api/irrigation`
Computes precision irrigation advice with ML inference and pathogen protection.

**Sample Request**:
```json
{
  "crop_type": "Tomato",
  "growth_stage": "Flowering",
  "soil_type": "Loamy",
  "soil_moisture": 16.0,
  "temperature": 26.0,
  "humidity": 78.0,
  "rain_forecast": "None",
  "forecast_rainfall_mm": 0.0,
  "farm_size_acres": 2.5,
  "irrigation_method": "Sprinkler / Overhead",
  "disease_context": "Early Blight"
}
```

**Sample Response**:
```json
{
  "status": "success",
  "action": "Hazard Alert: Overhead Watering Suspended - Switch to Root Drip",
  "action_code": "SUSPEND_OVERHEAD_BLIGHT",
  "urgency": "High",
  "foliar_blight_risk": "Critical Foliar Pathogen Risk",
  "recommended_water_liters_per_sqm": 3.69,
  "total_water_liters": 37332.5,
  "total_water_cubic_meters": 37.33,
  "recommended_duration_minutes": 0,
  "foliar_pathogen_interlock_active": true,
  "water_delivery_method": "Switch Immediately to Root-Zone Drip Lines",
  "pathogen_alert": "Active Early Blight detected. Overhead water droplets physically splash fungal spores and produce leaf wetness films that trigger Phytophthora and Alternaria spore penetration...",
  "ml_model_used": "Gradient Boosting Classifier + Random Forest Regressor",
  "ml_prediction_confidence": 100.0,
  "ml_predicted_water_mm": 3.69,
  "fao56_baseline_water_mm": 3.69,
  "iot_actuator_commands": {
    "motor_relay_state": 0,
    "duration_minutes": 0,
    "target_flow_liters": 0.0,
    "lockout_active": true
  }
}
```

### 2. `GET /api/irrigation/metrics`
Returns complete model cards, training timestamps, cross-validation metrics, confusion matrix, and feature importances for front-end transparency.

---

## 7. CLI Scripts

- **Train All Models**:
  ```bash
  venv\Scripts\python.exe model\irrigation\train_irrigation.py
  ```
- **Run Diagnostic Evaluation Suite**:
  ```bash
  venv\Scripts\python.exe model\irrigation\evaluate_irrigation.py
  ```
- **Verify or Download Kaggle Data**:
  ```bash
  venv\Scripts\python.exe dataset\irrigation\download_kaggle.py --verify-only
  ```
