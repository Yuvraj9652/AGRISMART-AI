# Smart Irrigation & Water Requirement Datasets

This directory contains benchmark and operational datasets used to train, evaluate, and benchmark the **AGRISMART-AI Precision Irrigation Machine Learning Engine** (Bonus Module B).

---

## 1. Included Datasets

### A. `kaggle_crop_water_requirement.csv` (768 records)
* **Origin**: Kaggle Benchmark (`prateekiiest/crop-water-requirement`, mirrored by `thedevastator/crop-water-requirement`).
* **Attributes**:
  - `CROP TYPE`: Potato, Wheat, Tomato, Onion
  - `SOIL TYPE`: Dry, Humid, Wet
  - `REGION`: Desert, Semi Arid, Semi Humid, Humid
  - `WEATHER CONDITION`: Normal, Sunny, Windy, Rainy
  - `TEMP_MIN`, `TEMP_MAX`: Minimum and maximum ambient temperature ranges (°C)
  - `WATER REQUIREMENT`: Reference crop evapotranspiration / water depth benchmark (mm/day)

### B. `iot_sensor_irrigation_data.csv` (1,007 records)
* **Origin**: Real-world IoT field telemetry (`aqib-ai-ml/ai-powered-smart-irrigation`).
* **Attributes**:
  - `timestamp`: Sensor timestamp
  - `plant`: Crop / plant species (Basil, Tomato, etc.)
  - `environment`: Field or Greenhouse indoor environment
  - `temperature`: DHT11/DHT22 temperature (°C)
  - `humidity`: Relative humidity (%)
  - `soil`: Capacitive soil moisture reading (%)
  - `water_required`: Actuator valve control trigger (0 = Standby, 1 = Water Required)

### C. `master_irrigation_dataset.csv` (5,200 records)
* **Origin**: Synthesized Physics-Informed Agronomic Field Dataset calibrated against **FAO-56 Irrigation & Drainage Paper 56**, ICAR standards, and foliar pathogen interlocks.
* **Attributes**:
  - `crop_type`: Tomato, Potato, Pepper Bell, Corn, Wheat, Cotton, Soybean, Rice, Sugarcane (9 crops)
  - `growth_stage`: Seedling, Vegetative, Flowering, Fruiting, Maturity
  - `soil_type`: Sandy, Sandy Loam, Loamy, Clay Loam, Black Soil
  - `soil_moisture`: Volumetric soil moisture percentage (4.0% – 55.0%)
  - `temperature`: Ambient temperature (°C)
  - `humidity`: Relative humidity (%)
  - `rain_forecast`: None, Low, Moderate, High
  - `forecast_rainfall_mm`: Expected precipitation depth in next 24 hours (mm)
  - `irrigation_method`: Drip Irrigation, Sprinkler (Overhead), Flood / Surface, Sub-surface Drip
  - `disease_context`: Vision diagnosis context (Healthy, Early Blight, Late Blight, Septoria, etc.)
  - `crop_kc`: FAO-56 crop coefficient
  - `reference_et0`: Reference evapotranspiration ($ET_0$) in mm/day
  - `crop_etc`: Crop evapotranspiration ($ET_c = ET_0 \times K_c$) in mm/day
  - `effective_precipitation_peff`: Effective infiltration rainfall ($P_{eff}$) in mm
  - `soil_field_capacity`: Field Capacity percentage ($FC$)
  - `soil_wilting_point`: Permanent Wilting Point percentage ($WP$)
  - `action_code`: Multi-class target label:
    - `IRRIGATE_IMMEDIATELY`
    - `MAINTENANCE_DRIP`
    - `DELAY_RAIN_EXPECTED`
    - `OPTIMAL_STANDBY`
    - `SUSPEND_OVERHEAD_BLIGHT` (Pathogen interlock guard)
  - `urgency`: Immediate, Normal, Moderate, Low
  - `water_requirement_mm`: Continuous target variable for precision depth (mm/day or L/$m^2$)

---

## 2. Additional Recommended Kaggle Datasets

If you wish to benchmark on additional public Kaggle datasets, you can use our built-in utility:

```bash
# List all recommended datasets and check local status
python dataset/irrigation/download_kaggle.py --list

# Verify dataset integrity
python dataset/irrigation/download_kaggle.py --verify
```

### Direct Kaggle Links:
1. **[Irrigation Water Requirement Prediction Dataset](https://www.kaggle.com/datasets/arifaishal/irrigation-water-requirement-prediction-dataset)** (by Arifa Ishal)
2. **[IoT Irrigation Sensor Dataset with Raspberry Pi](https://www.kaggle.com/datasets/abdullahsajid/iot-irrigation-sensor-dataset-with-raspberry-pi)** (by Abdullah Sajid)
3. **[Crop Water Requirement](https://www.kaggle.com/datasets/prateekiiest/crop-water-requirement)** (by Prateek Chanda)
4. **[Smart Irrigation System](https://www.kaggle.com/datasets/harshverma25/smart-irrigation-system)** (by Harsh Verma)
