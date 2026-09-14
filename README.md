# AGRISMART-AI 🌾🤖
> **Intelligent Agriculture for a Sustainable Future**  
> *SIH 2026 Hackathon Submission*

---

## 📌 1. Project Overview & Scope

**AGRISMART-AI** is an AI-powered agricultural advisory platform designed for farmers, agronomists, and agricultural stakeholders. The platform combines Computer Vision foliar pathology detection, explainable crop cultivar recommendation, smart irrigation control, grounded GenAI conversational advisory, and server-side JWT / Google OAuth authentication.

### 🏆 Implemented Challenge Scope
- **Real JWT & Google Authentication Authority:** FastAPI backend authority, SQLite database via SQLAlchemy, secure password hashing, and Google Identity Services server-side token verification.
- **Mandatory Core Task:** Autonomous Crop Disease Detection from Leaf Images (ResNet-50 PyTorch Model Adapter).
- **Bonus Module A:** Crop Recommendation Intelligence (`POST /api/recommend`).
- **Bonus Module B:** Smart Irrigation & Blight Prevention (`POST /api/irrigation`).
- **Bonus Module E:** GenAI Farmer Assistant & Voice Interface Adapter (`POST /api/assistant`, `POST /api/voice`).

---

## 🔐 2. Authentication & Security Architecture

AGRISMART-AI implements real, production-ready authentication:

```text
React Frontend (Vite)
  ├── Google Identity Services (Client ID in VITE_GOOGLE_CLIENT_ID)
  ├── Auth & API Service (JWT stored in LocalStorage, Bearer Token)
  └── Protected Application UI
        │
        ▼ (HTTP REST API)
FastAPI Backend Authority
  ├── POST /api/auth/register
  ├── POST /api/auth/login
  ├── POST /api/auth/google  ──▶ Server-Side Verification via google.oauth2.id_token
  ├── GET  /api/auth/me      ──▶ Protected Endpoint (JWT Verification)
  └── POST /api/auth/logout
        │
        ▼
SQLite Database (SQLAlchemy)
  └── users table (id, email, name, password_hash, google_sub, auth_provider, created_at)
```

### Key Security Features
- **FastAPI Authentication Authority:** Backend verifies all credentials and issues signed JWT tokens.
- **SQLite Database:** Automatically creates `agrismart.db` using SQLAlchemy models on server startup.
- **Google OAuth Verification:** Google ID token is verified server-side using Google's public certs. Uses stable Google `sub` identifier.
- **Password Hashing:** Secure salted password hashing using `bcrypt`.
- **Environment Configuration:** All private secrets (`JWT_SECRET_KEY`, `DATABASE_URL`) are isolated in backend environment variables. Frontend only uses public `VITE_GOOGLE_CLIENT_ID`.

---

## ⚙️ 3. Environment Configuration

### Root Backend `.env` Setup
Create a `.env` file in the project root directory (copied from `.env.example`):

```env
GOOGLE_CLIENT_ID=794206114572-o0espebqkcgrs9cjpjvh9msb4u32nh0t.apps.googleusercontent.com
JWT_SECRET_KEY=agrismart_super_secret_jwt_key_sih_2026_demo
DATABASE_URL=sqlite:///./agrismart.db
GEMINI_API_KEY=
OPENAI_API_KEY=
```
*Note: If `JWT_SECRET_KEY` is omitted, the backend automatically generates a cryptographically secure 32-byte secret on startup.*

### Frontend `.env` Setup
Create a `.env` file inside `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=794206114572-o0espebqkcgrs9cjpjvh9msb4u32nh0t.apps.googleusercontent.com
```

---

## 🚀 4. Quick Start & Startup Instructions

### Prerequisites
- Python 3.9+ installed
- Node.js 18+ & npm installed

### Step 1: Setup Backend & Virtual Environment
```bash
# Clone repository
git clone https://github.com/Yuvraj9652/AGRISMART-AI.git
cd AGRISMART-AI

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Launch FastAPI Backend Server
```bash
# Start FastAPI backend (runs on http://localhost:8000)
python -m uvicorn backend.main:app --reload --port 8000
```
*Database `agrismart.db` is initialized automatically on startup.*  
*Interactive Swagger Documentation live at: `http://localhost:8000/docs`*

### Step 3: Launch React/Vite Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🔌 5. API Endpoints Contract

| Group | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Registers new user and returns JWT token |
| **Auth** | `POST` | `/api/auth/login` | Authenticates email + password and returns JWT token |
| **Auth** | `POST` | `/api/auth/google` | Verifies Google ID token server-side and issues JWT |
| **Auth** | `GET` | `/api/auth/me` | Protected route returning authenticated user profile |
| **Auth** | `PUT` | `/api/auth/profile` | Updates user profile details in SQLite database |
| **Auth** | `POST` | `/api/auth/logout` | Client session logout acknowledgement |
| **System** | `GET` | `/api/health` | System health check & model checkpoint loaded status |
| **Core** | `POST` | `/api/predict` | Uploads leaf image, runs ResNet-50 PyTorch adapter |
| **Bonus A** | `POST` | `/api/recommend` | Dual ML & Agronomic Hybrid engine (Extra Trees Champion) for 28 crops |
| **Bonus A** | `GET` | `/api/recommend/metrics` | Kaggle Crop Recommendation ML benchmarks, confusion matrix, & XAI feature weights |
| **Bonus B** | `POST` | `/api/irrigation` | Dual-model PIML engine (Gradient Boosting + Random Forest) with foliar pathogen lockout |
| **Bonus B** | `GET` | `/api/irrigation/metrics` | Kaggle ML benchmark metrics, confusion matrix, & XAI feature importances |
| **Bonus E** | `POST` | `/api/assistant` | Queries grounded agronomist expert AI assistant |
| **Bonus E** | `POST` | `/api/voice` | Regional voice STT / TTS assistant interface adapter |

---

## 🌾 6. Bonus Module A: Crop Recommendation & Varietal Intelligence ML Engine

AGRISMART-AI integrates an autonomous **Dual-Engine Machine Learning & Agronomic Recommendation Suite** (compliant with `AGRISMART_AI_Architecture.docx` Sections 9 & 10):

### 🎯 Key Innovations
- **Champion Classifier:** Extra Trees Classifier with **99.82% Accuracy**, **0.9982 Macro-F1**, and **0.9928 5-Fold Stratified Cross-Validation F1** across 28 agricultural crops.
- **Physics-Informed Hybrid Scoring (PIML):** Fuses ML soft probability distribution (40%) with photoperiod seasonality constraints (25%), soil pH tolerance (12%), soil texture compatibility (10%), water source availability (8%), and crop rotation disease breaks (5%).
- **Soil Macro-Nutrient Health Diagnosis:** Evaluates Nitrogen, Phosphorus, Potassium, and pH levels, alerting the farmer to deficiencies, optimal ranges, and fertilizer application guidance.
- **Explainable AI (XAI):** Quantifies real environmental feature importances: Soil Potassium ($K$: 19.98%), Relative Humidity (19.60%), Cumulative Rainfall (18.04%), Soil Nitrogen ($N$: 14.40%), Soil Phosphorus ($P$: 13.31%), Ambient Temperature (9.35%), and pH (5.31%).
- **Kaggle Datasets Integrated:** Trained on 2,800 records synthesizing the canonical Kaggle benchmark (`atharvaingle/crop-recommendation-dataset`) with 6 key Indian staples (Wheat, Potato, Mustard, Sugarcane, Soybean, Tomato) calibrated to ICAR agro-ecological zones.

Detailed documentation, formulas, and evaluation scripts: [docs/CROP_RECOMMENDATION_ML.md](file:///b:/sih_internal/AGRISMART-AI/docs/CROP_RECOMMENDATION_ML.md)

---

## 💧 7. Bonus Module B: Smart Irrigation & Spore Suppression ML Engine

AGRISMART-AI integrates a **Physics-Informed Machine Learning (PIML)** Smart Irrigation engine directly linked to the Crop Disease Vision diagnostic output (as specified in `AGRISMART_AI_Architecture.docx` Sections 9 & 10):

### 🎯 Key Innovations
- **Foliar Pathogen Spore Suppression Interlock:** If the vision model detects foliar pathogens (*Early Blight*, *Late Blight*, *Leaf Mold*), overhead sprinkler watering is immediately halted in software to prevent leaf wetness and fungal conidia/zoospore splash dispersal. The engine switches automatically to root-zone drip.
- **Champion Classifier (Action Prediction):** Gradient Boosting Classifier with **99.71% Accuracy**, **0.9970 Macro-F1**, and **0.9977 5-Fold Cross-Validation F1**.
- **Champion Regressor (Water Depth Prediction):** Random Forest Regressor with **$R^2 = 0.9275$**, **MAE = 0.234 mm**, and **RMSE = 0.558 mm**.
- **IoT Relay Telemetry:** Outputs hardware control payloads (`motor_relay_state`, `duration_minutes`, `target_flow_liters`, `lockout_active`) for ESP32 / LoRa smart farm solenoids.
- **Kaggle Datasets Integrated:** Trained on 5,200 records synthesizing the Kaggle `prateekiiest/crop-water-requirement` benchmark, open IoT capacitive sensor telemetry, and FAO-56 Penman-Monteith physical water flux equations.

Detailed documentation, formulas, and evaluation scripts: [docs/SMART_IRRIGATION_ML.md](file:///b:/sih_internal/AGRISMART-AI/docs/SMART_IRRIGATION_ML.md)

---

## 🤖 8. Service Availability & ML / GenAI Integration Status

AGRISMART-AI follows a **Strict Integration Boundary** design pattern. It does NOT generate fake or hardcoded predictions to pretend a model is loaded when it is not.

- **ML ResNet-50 Model Adapter (`model/adapter.py`):**
  - Accepts `.pth` PyTorch weights placed in `model/weights/resnet50_best.pth`.
  - When checkpoint is loaded, executes real PyTorch ResNet-50 inference.
  - When `.pth` checkpoint is pending, returns explicit adapter status (`checkpoint_loaded: false`, `is_placeholder: true`) so the UI displays an authentic status badge.

- **GenAI Farmer Assistant (`backend/routes/assistant.py`):**
  - Connects dynamically to Gemini LLM (`GEMINI_API_KEY`) or OpenAI (`OPENAI_API_KEY`).
  - If API key is missing, returns `status: "service_unavailable"` informing the user that GenAI API keys are pending configuration, rather than outputting hardcoded AI responses.

---

## 📄 9. License & Originality Declaration
Submitted for **SIH 2026 Hackathon Evaluation**. Reused open-source libraries and pretrained models are cited above. Original solution architecture built for SIH evaluation.