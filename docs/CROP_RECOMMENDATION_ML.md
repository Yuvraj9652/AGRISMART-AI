# AGRISMART-AI — Crop Recommendation & Varietal Intelligence ML Suite

> **Module Specification & Architecture Alignment**  
> Compliant with [AGRISMART_AI_Architecture.docx Section 9 (Optional PS Bonus Architecture) & Section 10 (Product Data Flow)](file:///b:/sih_internal/AGRISMART-AI/AGRISMART_AI_Architecture.docx).

---

## 1. Executive Summary

AGRISMART-AI's **Crop Recommendation Engine** (Bonus Module A) has been built into an autonomous **Dual-Engine Machine Learning & Agronomic Suite**. It fuses probabilistic multi-class machine learning predictions trained on the gold-standard Kaggle benchmark with biological domain constraints from the Indian Council of Agricultural Research (ICAR).

### Key Architectural Pillars
1. **Multi-Model ML Classifier Suite**: Evaluates 5 machine learning architectures across 28 crops ($N, P, K, \text{temperature}, \text{humidity}, pH, \text{rainfall}$) with **99.82% Held-Out Accuracy** and **0.9982 Macro-F1**.
2. **Hybrid Multi-Criteria Scoring (PIML)**: Fuses soft ML class probabilities (40%) with photoperiod seasonality constraints (25%), soil pH tolerance (12%), soil texture compatibility (10%), water source availability (8%), and crop rotational synergy (5%).
3. **Soil Macro-Nutrient Health Diagnosis**: Evaluates Nitrogen, Phosphorus, Potassium, and pH levels, alerting the farmer to deficiencies, optimal ranges, and fertilizer application guidance.
4. **Explainable AI (XAI)**: Quantifies real environmental feature importances driving crop selection, providing transparent reasoning for agronomists and judges.

---

## 2. Dataset Provenance & Synthesis

The models were trained and benchmarked across two standardized datasets:

| Dataset Component | Records | Crops | Features | Source / Description |
| :--- | :---: | :---: | :---: | :--- |
| **Canonical Kaggle Benchmark** | 2,200 | 22 | 8 | [Kaggle: atharvaingle/crop-recommendation-dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset) |
| **Calibrated Master Dataset** | 2,800 | 28 | 8 | Kaggle benchmark augmented with 6 key Indian staples (Wheat, Potato, Mustard, Sugarcane, Soybean, Tomato) calibrated to ICAR agro-ecological zones |

### Automatic Kaggle CLI Utility
A standalone utility [dataset/crop_recommendation/download_kaggle.py](file:///b:/sih_internal/AGRISMART-AI/dataset/crop_recommendation/download_kaggle.py) is provided:
```bash
# Verify local file presence and record counts
python dataset/crop_recommendation/download_kaggle.py --verify-only

# Re-download from mirror and rebuild master dataset
python dataset/crop_recommendation/download_kaggle.py --download-all
```

---

## 3. Model Architecture & Benchmarking Results

Five multi-class classification algorithms were evaluated under an **honest 80/20 stratified train/test split** (2,240 train samples, 560 held-out test samples) with 5-fold Stratified Cross-Validation:

| Model Architecture | Accuracy | Macro-F1 | Macro-Precision | Macro-Recall | 5-Fold CV F1 | Fit Time | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Extra Trees Classifier** | **99.82%** | **0.9982** | **0.9983** | **0.9982** | **0.9928** | 1.00 s | 🏆 **Champion** |
| Random Forest Classifier | 99.64% | 0.9964 | 0.9967 | 0.9964 | 0.9946 | 5.06 s | Evaluated |
| Gaussian Naive Bayes | 99.82% | 0.9982 | 0.9983 | 0.9982 | 0.9928 | 0.06 s | Baseline |
| Support Vector Classifier (RBF) | 98.93% | 0.9893 | 0.9904 | 0.9893 | 0.9866 | 1.04 s | Evaluated |
| Gradient Boosting Classifier | 98.93% | 0.9893 | 0.9906 | 0.9893 | 0.9817 | 53.70 s | Evaluated |

### Held-Out Test Set Per-Class Classification Report (Excerpt)
```
              precision    recall  f1-score   support
       apple       1.00      1.00      1.00        20
      banana       1.00      1.00      1.00        20
   blackgram       1.00      1.00      1.00        20
    chickpea       1.00      1.00      1.00        20
     coconut       1.00      1.00      1.00        20
      coffee       1.00      1.00      1.00        20
      cotton       1.00      1.00      1.00        20
      grapes       1.00      1.00      1.00        20
        jute       1.00      1.00      1.00        20
 kidneybeans       1.00      1.00      1.00        20
      lentil       1.00      0.95      0.97        20
       maize       1.00      1.00      1.00        20
       mango       1.00      1.00      1.00        20
   mothbeans       0.95      1.00      0.98        20
    mungbean       1.00      1.00      1.00        20
   muskmelon       1.00      1.00      1.00        20
     mustard       1.00      1.00      1.00        20
      orange       1.00      1.00      1.00        20
      papaya       1.00      1.00      1.00        20
  pigeonpeas       1.00      1.00      1.00        20
 pomegranate       1.00      1.00      1.00        20
      potato       1.00      1.00      1.00        20
        rice       1.00      1.00      1.00        20
     soybean       1.00      1.00      1.00        20
   sugarcane       1.00      1.00      1.00        20
      tomato       1.00      1.00      1.00        20
  watermelon       1.00      1.00      1.00        20
       wheat       1.00      1.00      1.00        20
    accuracy                           1.00       560
   macro avg       1.00      1.00      1.00       560
weighted avg       1.00      1.00      1.00       560
```

---

## 4. Explainable AI (XAI) Feature Importance

The champion model assigns feature importance across physical soil chemistry and microclimate drivers:

| Feature Name | Description | Importance (%) | Agricultural Interpretation |
| :--- | :--- | :---: | :--- |
| `K` | Soil Potassium | **19.98%** | Crucial discriminator for fruit crops (Banana, Grapes, Apple require 100–300 kg/ha) |
| `humidity` | Relative Humidity | **19.60%** | Distinguishes arid desert pulses from coastal tropical crops (Coconut, Rice) |
| `rainfall` | Cumulative Rainfall | **18.04%** | Primary indicator of water availability and flood vs drought tolerance |
| `N` | Soil Nitrogen | **14.40%** | Distinguishes cereal heavy feeders (Wheat, Rice, Maize) from legumes |
| `P` | Soil Phosphorus | **13.31%** | Essential for root establishment and energy transfer (ATP synthesis) |
| `temperature` | Air Temperature | **9.35%** | Defines thermal growth windows and chilling requirements |
| `ph` | Soil Reaction | **5.31%** | Controls nutrient solubility and microbial nitrogen fixation |

---

## 5. REST API Specifications

### 1. `POST /api/recommend`
Evaluates farm parameters and returns precision varietal intelligence.

**Sample Request**:
```json
{
  "season": "Winter (Rabi)",
  "soil_type": "Loamy",
  "ph": 6.8,
  "nitrogen": 110.0,
  "phosphorus": 55.0,
  "potassium": 45.0,
  "temperature": 18.0,
  "humidity": 55.0,
  "rainfall": 60.0,
  "water_availability": "Borewell / Tubewell",
  "region": "North India",
  "previous_crop": "Legumes / Pulses"
}
```

**Sample Response**:
```json
{
  "status": "success",
  "top_recommendation": {
    "crop_name": "Wheat",
    "cultivar_variety": "HD-2967 (Pusa Yashasvi - Rust Resistant)",
    "suitability_score": 0.958,
    "suitability_percentage": "95.8%",
    "season_category": "Winter (Rabi)",
    "pathogen_resistance": "Stripe Rust & Leaf Rust Resistant",
    "estimated_yield": "50 - 58 Quintals/Ha",
    "growth_duration_days": "135 - 145 Days",
    "reasoning": "Thrives under cool rabi vegetative phase and warm ripening conditions. ML Probability: 89.6%...",
    "nutrient_guidance": "120:60:40 kg/ha NPK with 2 split doses of urea at first crown root initiation and tillering.",
    "rotation_advice": "High rotational synergy: Leverages residual nitrogen fixed by previous pulse crop.",
    "water_requirement": "Moderate (Requires 4-5 critical irrigations)"
  },
  "alternative_recommendations": [
    { "crop_name": "Mustard / Rapeseed", "suitability_percentage": "62.2%" },
    { "crop_name": "Barley", "suitability_percentage": "60.2%" },
    { "crop_name": "Garlic & Onion", "suitability_percentage": "60.2%" }
  ],
  "inference_engine": "Dual ML & Agronomic Hybrid (Extra Trees Champion)",
  "ml_model_used": "Extra Trees Classifier",
  "ml_prediction_confidence": 89.6,
  "top_candidates": [
    { "crop_name": "Wheat", "probability": 89.6 },
    { "crop_name": "Mustard", "probability": 5.5 },
    { "crop_name": "Tomato", "probability": 1.9 }
  ],
  "soil_nutrient_status": {
    "nitrogen": "Optimal (50-120 kg/ha)",
    "phosphorus": "Optimal (30-70 kg/ha)",
    "potassium": "Optimal (35-80 kg/ha)",
    "ph_reaction": "Neutral / Optimal"
  },
  "feature_importances": {
    "K": 19.98,
    "humidity": 19.6,
    "rainfall": 18.04,
    "N": 14.4,
    "P": 13.31,
    "temperature": 9.35,
    "ph": 5.31
  }
}
```

### 2. `GET /api/recommend/metrics`
Returns complete model cards, training timestamps, 5-fold cross-validation metrics, confusion matrix, and feature importances.

---

## 6. CLI Execution Commands

- **Train ML Models**:
  ```bash
  venv\Scripts\python.exe model\crop_recommendation\train_crop_recommendation.py
  ```
- **Run Diagnostic Scenarios**:
  ```bash
  venv\Scripts\python.exe model\crop_recommendation\evaluate_crop_recommendation.py
  ```
- **Verify or Download Kaggle Data**:
  ```bash
  venv\Scripts\python.exe dataset\crop_recommendation\download_kaggle.py --verify-only
  ```
