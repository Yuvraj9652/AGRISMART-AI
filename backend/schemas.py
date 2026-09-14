"""
Pydantic Schemas for AGRISMART-AI REST API endpoints.
Enforces strict contracts for all core and bonus module endpoints.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# -------------------------------------------------------------
# 1. HEALTH SCHEMA
# -------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    service: str = Field(..., example="AGRISMART-AI API")
    version: str = Field(..., example="1.0.0")
    model_checkpoint_loaded: bool = Field(..., example=False)
    timestamp: float

# -------------------------------------------------------------
# 2. PREDICT SCHEMAS
# -------------------------------------------------------------
class PredictResponse(BaseModel):
    status: str
    checkpoint_loaded: bool
    is_placeholder: bool
    prediction: str
    raw_class: Optional[str] = None
    crop: str
    pathogen: str
    severity: str
    confidence: float
    confidence_percentage: str
    precautions: List[str]
    disclaimer: str
    inference_time_ms: float
    model_info: Dict[str, Any]
    message: Optional[str] = None

# -------------------------------------------------------------
# 3. CROP RECOMMENDATION SCHEMAS (BONUS MODULE A)
# -------------------------------------------------------------
class CropRecommendRequest(BaseModel):
    season: str = Field("Monsoon (Kharif)", example="Monsoon (Kharif)")  # Monsoon (Kharif), Winter (Rabi), Summer (Zaid)
    soil_type: str = Field("Loamy", example="Loamy")  # Loamy, Clay Loam, Sandy Loam, Alluvial Soil, Black Cotton Soil, Red Soil
    ph: float = Field(6.5, ge=0.0, le=14.0, example=6.5)
    nitrogen: Optional[float] = Field(80.0, ge=0.0, le=300.0, example=80.0)      # N in kg/ha
    phosphorus: Optional[float] = Field(45.0, ge=0.0, le=200.0, example=45.0)    # P in kg/ha
    potassium: Optional[float] = Field(50.0, ge=0.0, le=300.0, example=50.0)      # K in kg/ha
    temperature: float = Field(26.0, example=26.0)                                # Celsius
    humidity: float = Field(65.0, ge=0.0, le=100.0, example=65.0)                # %
    rainfall: float = Field(200.0, ge=0.0, example=200.0)                         # mm
    water_availability: Optional[str] = Field("Borewell / Tubewell", example="Borewell / Tubewell")
    region: Optional[str] = Field("North India", example="North India")
    previous_crop: Optional[str] = Field("None / Fallow", example="Legumes / Pulses")

class CropRecommendationItem(BaseModel):
    crop_name: str
    cultivar_variety: str
    suitability_score: float
    suitability_percentage: str
    season_category: str
    pathogen_resistance: str
    estimated_yield: str
    growth_duration_days: str
    reasoning: str
    nutrient_guidance: str
    rotation_advice: str
    water_requirement: str
    # Backward compatibility fields
    estimated_yield_boost: Optional[str] = None

class CropRecommendResponse(BaseModel):
    status: str = "success"
    soil_and_climate_summary: Dict[str, Any]
    soil_summary: Optional[Dict[str, Any]] = None  # Backward compatibility
    top_recommendation: CropRecommendationItem
    alternative_recommendations: List[CropRecommendationItem]
    explainable_logic: str
    seasonal_context: str
    # Machine Learning Precision Intelligence Fields
    inference_engine: Optional[str] = "Machine Learning (Random Forest + Agronomic Hybrid)"
    ml_model_used: Optional[str] = "Random Forest Classifier (28-Crop Multi-Class)"
    ml_prediction_confidence: Optional[float] = 99.6
    top_candidates: Optional[List[Dict[str, Any]]] = None
    feature_importances: Optional[Dict[str, float]] = None
    soil_nutrient_status: Optional[Dict[str, Any]] = None

class CropMetricsResponse(BaseModel):
    status: str = "success"
    champion_classifier: str
    trained_at: str
    dataset_records: int
    train_samples: int
    test_samples: int
    number_of_crops: int
    supported_crops: List[str]
    feature_names: List[str]
    champion_classifier_metrics: Dict[str, Any]
    classifier_benchmarks: Dict[str, Any]
    per_class_metrics: Dict[str, Any]
    confusion_matrix: Dict[str, Any]
    feature_importances: Dict[str, float]

# -------------------------------------------------------------
# 4. SMART IRRIGATION SCHEMAS (BONUS MODULE B)
# -------------------------------------------------------------
class IrrigationRequest(BaseModel):
    soil_moisture: float = Field(35.0, ge=0.0, le=100.0, example=35.0)  # %
    crop_type: str = Field("Tomato", example="Tomato")
    growth_stage: str = Field("Vegetative", example="Vegetative")       # Seedling, Vegetative, Flowering, Fruiting, Maturity
    soil_type: Optional[str] = Field("Loamy", example="Loamy")           # Sandy, Sandy Loam, Loamy, Clay Loam, Black Soil
    farm_size_acres: Optional[float] = Field(1.0, ge=0.0001, example=5.0) # Supports ANY farm size (from 0.01 to 10,000+ acres)
    irrigation_method: Optional[str] = Field("Drip Irrigation", example="Drip Irrigation")  # Drip Irrigation, Sprinkler (Overhead), Flood / Surface, Sub-surface Drip
    temperature: Optional[float] = Field(28.0, example=28.0)            # Celsius
    humidity: Optional[float] = Field(65.0, example=65.0)                # %
    rain_forecast: Optional[str] = Field("None", example="None")         # None, Low, Moderate, High
    forecast_rainfall_mm: Optional[float] = Field(0.0, ge=0.0, example=0.0) # mm in next 24h
    disease_context: Optional[str] = Field("None / Healthy", example="Tomato Early Blight") # Foliar pathogen context

class IrrigationResponse(BaseModel):
    status: str = "success"
    action: str                        # "Irrigate Immediately", "Delay Irrigation", "Optimal Moisture", etc.
    action_code: str                   # "IRRIGATE_IMMEDIATELY", "DELAY_RAIN_EXPECTED", "MAINTENANCE_DRIP", "OPTIMAL_STANDBY", "SUSPEND_OVERHEAD_BLIGHT"
    urgency: str                       # "Immediate", "High", "Moderate", "Low", "Standby"
    foliar_blight_risk: str            # "High Spore Risk", "Moderate Risk", "Low Foliar Risk"
    recommended_water_liters_per_sqm: float
    total_water_liters: float          # Scaled for any farm size
    total_water_cubic_meters: float    # Scaled in m³ (1 m³ = 1,000 L)
    recommended_duration_minutes: int  # Minutes pump / application needs to run
    recommended_time_window: str       # e.g. "05:30 AM - 07:15 AM (Dawn Drip)"
    moisture_status: str               # "Critical Deficit", "Moderate Deficit", "Optimal", "Saturated"
    reasoning: str                     # Primary reasoning
    pathogen_alert: str                # Specific pathogen advice (Alternaria/Phytophthora)
    sustainability_water_saved_liters: float # Liters saved vs flood baseline
    irrigation_efficiency_score: int   # Score out of 100
    water_delivery_method: str         # Agronomic delivery recommendation
    irrigation_schedule_advice: str    # Timing and application schedule
    agronomic_reasoning: str           # Detailed agronomic analysis
    scientific_breakdown: Dict[str, Any] # FAO-56 math components (ET0, Kc, ETc, Peff, Deficit)
    farmer_guidance: str               # Plain-language advisory
    # Machine Learning Precision Intelligence Fields
    inference_engine: Optional[str] = "Dual ML Model (Gradient Boosting + Random Forest PIML)"
    ml_model_used: Optional[str] = "Gradient Boosting Classifier + Random Forest Regressor"
    ml_prediction_confidence: Optional[float] = 99.7  # % confidence
    ml_predicted_water_mm: Optional[float] = None
    fao56_baseline_water_mm: Optional[float] = None
    feature_importances: Optional[Dict[str, float]] = None
    foliar_pathogen_interlock_active: Optional[bool] = False
    solenoid_zone_recommendation: Optional[str] = None # Backward compatibility
    iot_actuator_commands: Optional[Dict[str, Any]] = None # Backward compatibility

class IrrigationMetricsResponse(BaseModel):
    status: str = "success"
    champion_classifier: str
    champion_regressor: str
    trained_at: str
    dataset_records: int
    train_samples: int
    test_samples: int
    champion_classifier_metrics: Dict[str, Any]
    champion_regressor_metrics: Dict[str, Any]
    classifier_benchmarks: Dict[str, Any]
    regressor_benchmarks: Dict[str, Any]
    confusion_matrix: Dict[str, Any]
    classifier_feature_importances: Dict[str, float]
    regressor_feature_importances: Dict[str, float]
    supported_crops: List[str]

# -------------------------------------------------------------
# 5. GENAI FARMER ASSISTANT SCHEMAS (BONUS MODULE E)
# -------------------------------------------------------------
class ChatMessage(BaseModel):
    sender: str  # "user" or "ai"
    text: str

class AssistantRequest(BaseModel):
    message: str = Field(..., example="What precautions should I take for Early Blight?")
    crop_context: Optional[str] = Field("Tomato", example="Tomato")
    disease_context: Optional[str] = Field("Tomato Early Blight", example="Tomato Early Blight")
    confidence_context: Optional[str] = Field("91%", example="91%")
    history: Optional[List[ChatMessage]] = Field(default_factory=list)

class AssistantResponse(BaseModel):
    status: str = "success"
    reply: str
    subtext: Optional[str] = None
    source: str = Field(..., example="Agronomic Expert Logic / GenAI Adapter")
    suggested_prompts: List[str]

# -------------------------------------------------------------
# 6. VOICE ASSISTANT SCHEMAS (BONUS MODULE E)
# -------------------------------------------------------------
class VoiceRequest(BaseModel):
    audio_base64: Optional[str] = Field(None, example=None)
    transcription_text: Optional[str] = Field(None, example="How do I cure leaf spot?")
    language: str = Field("en", example="en")  # en, hi, gu, mr, etc.

class VoiceResponse(BaseModel):
    status: str = "success"
    transcription: str
    reply_text: str
    audio_base64: Optional[str] = None  # Base64 TTS audio if available
    language: str
    is_placeholder_stt: bool = False
