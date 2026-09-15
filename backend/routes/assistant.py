"""
POST /api/assistant endpoint (Bonus Module E: GenAI Farmer Assistant).
Provides plain-language agronomic answers grounded in disease prediction telemetry and precaution guidelines.
Supports external LLM API keys (Gemini / OpenAI) if set in environment.
"""

import os
import requests
from fastapi import APIRouter
from backend.schemas import AssistantRequest, AssistantResponse

router = APIRouter()

@router.post("/api/assistant", response_model=AssistantResponse, tags=["Bonus Module E: Farmer Assistant & Voice"])
def farmer_assistant(req: AssistantRequest):
    """
    Conversational assistant answering farmer queries grounded in disease diagnostic telemetry.
    """
    user_msg = req.message.strip()
    crop = req.crop_context or "Tomato"
    disease = req.disease_context or "Tomato Early Blight"
    confidence = req.confidence_context or "91%"

    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    # 1. Attempt LLM API call if API key provided by GenAI teammate
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            prompt_payload = {
                "contents": [{
                    "parts": [{
                        "text": f"You are AgriSmart AI Agronomist, a friendly expert advisor for farmers in India. "
                                f"Active Telemetry Context: Crop={crop}, Disease={disease}, Confidence={confidence}. "
                                f"User question: {user_msg}. "
                                f"Provide clear, actionable, empathetic advice in 2-4 sentences. Include organic/cultural precautions first."
                    }]
                }]
            }
            res = requests.post(url, json=prompt_payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                reply_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return AssistantResponse(
                    status="success",
                    reply=reply_text,
                    subtext=f"Grounded response powered by Gemini LLM (Telemetry: {disease} {confidence})",
                    source="Gemini GenAI Engine",
                    suggested_prompts=get_suggested_prompts(user_msg)
                )
        except Exception as e:
            pass

    if openai_key:
        try:
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are AgriSmart AI Agronomist."},
                    {"role": "user", "content": f"Crop: {crop}, Disease: {disease}. Question: {user_msg}"}
                ]
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                reply_text = data["choices"][0]["message"]["content"].strip()
                return AssistantResponse(
                    status="success",
                    reply=reply_text,
                    subtext=f"Response powered by OpenAI LLM",
                    source="OpenAI GenAI Engine",
                    suggested_prompts=get_suggested_prompts(user_msg)
                )
        except Exception:
            pass

    # 3. Grounded agronomic advisory fallback engine
    reply_text, subtext = generate_agronomic_reply(user_msg, crop, disease, confidence)
    return AssistantResponse(
        status="success",
        reply=reply_text,
        subtext=f"Grounded AgriSmart Advisor ({subtext})",
        source="AgriSmart Agronomic Knowledge Engine",
        suggested_prompts=get_suggested_prompts(user_msg)
    )

def generate_agronomic_reply(text: str, crop: str, disease: str, confidence: str) -> tuple:
    lower = text.lower()

    if "what does this disease mean" in lower or "mean" in lower or "what is" in lower:
        return (
            f"{disease} is caused by foliar fungal pathogen Alternaria solani. It manifests as dark concentric target spots surrounded by chlorotic yellow halos on lower foliage. "
            f"If left unchecked, leaf tissue dies and defoliates, reducing fruit yield.",
            f"Context: {crop} ({confidence} confidence)"
        )

    if "precaution" in lower or "what precautions" in lower or "prevent" in lower:
        return (
            f"Key precautions for {disease}:\n"
            f"1. Prune and safely destroy infected lower leaves off-field.\n"
            f"2. Water strictly at plant base using drip irrigation to keep foliage dry.\n"
            f"3. Ensure canopy airflow by spacing plants properly.\n"
            f"4. Apply copper-based or bio-fungicides if wet weather persists.",
            f"Recommended precautions for {disease}"
        )

    if "simply" in lower or "explain" in lower or "easy" in lower:
        return (
            f"In simple terms: your {crop} plant has a common leaf fungus called Early Blight. It creates dark target-like spots on bottom leaves. "
            f"Trimming off those infected leaves and keeping water off the foliage will help protect new leaves and fruits!",
            "Simplified farmer guidance"
        )

    if "spread" in lower or "contagious" in lower:
        return (
            f"To stop {disease} from spreading:\n"
            f"• Disinfect shears between prunings.\n"
            f"• Mulch plant base to block soil splash.\n"
            f"• Avoid working among wet plants.\n"
            f"• Rotate with non-solanaceous crops next season.",
            "Spore containment measures"
        )

    return (
        f"For {disease} ({confidence} confidence), the primary recommendation is physical removal of lower affected leaves and maintaining dry foliage via root drip irrigation. "
        f"If symptoms worsen, consult your local agricultural extension officer for safe bio-fungicide treatments.",
        f"Grounded advisor for {crop}"
    )

def get_suggested_prompts(user_msg: str) -> list:
    return [
        "What does this disease mean?",
        "What precautions should I take?",
        "Explain this result simply",
        "How can I prevent this disease from spreading?"
    ]
