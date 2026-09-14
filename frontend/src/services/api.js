/**
 * AGRISMART-AI API Helper Service
 * Connects React frontend UI components to FastAPI backend REST endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// -------------------------------------------------------------
// TOKEN MANAGEMENT HELPERS
// -------------------------------------------------------------
export function getAuthToken() {
  return localStorage.getItem('agrismart_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('agrismart_token', token);
  } else {
    localStorage.removeItem('agrismart_token');
  }
}

export function clearAuthToken() {
  localStorage.removeItem('agrismart_token');
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------
export async function registerApi(userData) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Registration failed (${response.status})`);
  }

  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function loginApi(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Login failed (${response.status})`);
  }

  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function googleAuthApi(idToken) {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Google login failed (${response.status})`);
  }

  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function getMeApi() {
  const token = getAuthToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    clearAuthToken();
    return null;
  }

  return await response.json();
}

export async function logoutApi() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Logout API call error:", err);
  } finally {
    clearAuthToken();
  }
}

export async function updateProfileApi(profileData) {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(profileData),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Profile update failed (${response.status})`);
  }
  return data;
}

export async function incrementScansApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/increment-scans`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Increment scans API error:", err);
  }
  return null;
}

// -------------------------------------------------------------
// 2. CORE & BONUS AGRICULTURE ENDPOINTS
// -------------------------------------------------------------
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return await res.json();
  } catch (err) {
    console.warn("Backend API offline or unreachable:", err);
    return { status: "offline", error: err.message };
  }
}

export async function predictDisease(imageFileOrBlob, crop = 'tomato', growthStage = 'vegetative', notes = '') {
  try {
    const formData = new FormData();
    if (imageFileOrBlob instanceof File || imageFileOrBlob instanceof Blob) {
      formData.append('file', imageFileOrBlob, imageFileOrBlob.name || 'leaf_specimen.jpg');
    } else if (typeof imageFileOrBlob === 'string' && imageFileOrBlob.startsWith('data:image')) {
      const res = await fetch(imageFileOrBlob);
      const blob = await res.blob();
      formData.append('file', blob, 'leaf_specimen.jpg');
    } else {
      throw new Error("Invalid image format provided for prediction.");
    }

    formData.append('crop', crop);
    formData.append('growth_stage', growthStage);
    if (notes) formData.append('notes', notes);

    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Prediction request failed (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error("API Predict error:", err);
    throw err;
  }
}

export async function recommendCrops(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommend`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Crop recommendation failed (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error("API Crop recommendation error:", err);
    throw err;
  }
}

export async function getCropMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommend/metrics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch crop recommendation metrics (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error("API Crop Metrics error:", err);
    throw err;
  }
}

export async function evaluateIrrigation(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/irrigation`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Smart irrigation evaluation failed (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error("API Smart Irrigation error:", err);
    throw err;
  }
}

export async function getIrrigationMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/irrigation/metrics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch irrigation metrics (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error("API Irrigation Metrics error:", err);
    throw err;
  }
}

export async function askAssistant(message, cropContext = 'Tomato', diseaseContext = 'Tomato Early Blight', history = []) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        message,
        crop_context: cropContext,
        disease_context: diseaseContext,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error(`Assistant query failed (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error("API Assistant error:", err);
    throw err;
  }
}

export async function processVoice(transcriptionText, language = 'en') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voice`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        transcription_text: transcriptionText,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`Voice endpoint error (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error("API Voice error:", err);
    throw err;
  }
}
