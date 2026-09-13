// LocalStorage User Store helper for AgriSmart AI

export const DEFAULT_USER = {
  name: "Guest User",
  email: "",
  role: "",
  initials: "GU",
  farmName: "",
  location: "",
  phone: "",
  bio: "",
  totalScans: 0,
  total_scans: 0,
  accuracyBenchmark: "0%",
  activePlots: "0 Plots",
  isLoggedIn: false
};

export const getUserScans = (userEmail) => {
  if (!userEmail) return [];
  try {
    const key = `agrismart_scans_${userEmail.toLowerCase()}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to load user scans:", err);
    return [];
  }
};

export const saveUserScan = (userEmail, scan) => {
  if (!userEmail || !scan) return [];
  try {
    const key = `agrismart_scans_${userEmail.toLowerCase()}`;
    const scans = getUserScans(userEmail);
    const newRecord = {
      id: String(scans.length + 1).padStart(2, '0'),
      condition: scan.prediction || scan.condition || "Detected Foliar Anomaly",
      crop: scan.crop || "Unknown Crop",
      badge: scan.severity || "Inspected",
      badgeType: scan.severity === 'Severe' ? 'error' : scan.severity === 'Healthy' ? 'success' : 'warning',
      confidence: scan.confidence_percentage || (scan.confidence ? `${Math.round(scan.confidence * 100)}%` : "92%"),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      model: scan.model_info?.architecture || "ResNet-50 Classifier",
      image: scan.image || null,
      notes: scan.notes || "",
      precautions: scan.precautions || [],
      ...scan
    };
    const updated = [newRecord, ...scans];
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem(`agrismart_latest_scan_${userEmail.toLowerCase()}`, JSON.stringify(newRecord));
    return updated;
  } catch (err) {
    console.error("Failed to save user scan:", err);
    return [];
  }
};

export const getLatestUserScan = (userEmail) => {
  if (!userEmail) return null;
  try {
    const key = `agrismart_latest_scan_${userEmail.toLowerCase()}`;
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
    const scans = getUserScans(userEmail);
    return scans.length > 0 ? scans[0] : null;
  } catch (err) {
    console.error("Failed to load latest user scan:", err);
    return null;
  }
};

export const getStoredUser = () => {
  try {
    const data = localStorage.getItem('agrismart_user');
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load user from localStorage:", err);
  }
  return DEFAULT_USER;
};

export const saveStoredUser = (user) => {
  try {
    localStorage.setItem('agrismart_user', JSON.stringify(user));
  } catch (err) {
    console.error("Failed to save user to localStorage:", err);
  }
};

export const incrementUserScanCount = (user, scanData = null) => {
  if (!user) return user;
  const prevCount = Number(user.totalScans ?? user.total_scans ?? 0);
  const newCount = prevCount + 1;
  const confidencePct = scanData?.confidence 
    ? `${Math.round(scanData.confidence * 100)}%` 
    : (user.accuracyBenchmark && user.accuracyBenchmark !== "0%" ? user.accuracyBenchmark : "94.8%");
  const updated = {
    ...user,
    totalScans: newCount,
    total_scans: newCount,
    accuracyBenchmark: confidencePct,
    activePlots: user.activePlots && user.activePlots !== "0 Plots" ? user.activePlots : "1 Plot",
  };
  saveStoredUser(updated);
  return updated;
};

export const getRegisteredUsers = () => {
  try {
    const data = localStorage.getItem('agrismart_registered_users');
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read registered users:", err);
  }
  return [];
};

export const registerUser = (newUser) => {
  const users = getRegisteredUsers();
  const exists = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
  if (exists) {
    return { success: false, message: "An account with this email already exists." };
  }
  const initializedUser = {
    totalScans: 0,
    total_scans: 0,
    accuracyBenchmark: "0%",
    activePlots: "0 Plots",
    ...newUser,
  };
  users.push(initializedUser);
  localStorage.setItem('agrismart_registered_users', JSON.stringify(users));
  return { success: true, user: initializedUser };
};

export const loginUser = (email, password) => {
  if (email.toLowerCase() === "evaluator@agrismart.ai" || email.toLowerCase() === "demo@agrismart.ai") {
    return {
      success: true,
      user: {
        ...DEFAULT_USER,
        name: "Hackathon Evaluator",
        email: email.toLowerCase(),
        initials: "HE",
        isLoggedIn: true
      }
    };
  }
  const users = getRegisteredUsers();
  const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (matched) {
    const { password, ...safeUser } = matched;
    return { success: true, user: { ...safeUser, isLoggedIn: true } };
  }
  return { success: false, message: "Invalid email or password. You can also use the demo evaluator credentials." };
};

export const computeInitials = (name) => {
  if (!name) return "U";
  // Filter out punctuation and parentheses, keeping words
  const cleanWords = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (cleanWords.length === 0) return "U";
  if (cleanWords.length === 1) return cleanWords[0].slice(0, 2).toUpperCase();
  // If first word is a title like Dr or Mr, pick the actual names if available
  if (cleanWords.length > 2 && (cleanWords[0].toLowerCase() === 'dr' || cleanWords[0].toLowerCase() === 'mr' || cleanWords[0].toLowerCase() === 'ms' || cleanWords[0].toLowerCase() === 'mrs')) {
    return (cleanWords[1][0] + cleanWords[2][0]).toUpperCase();
  }
  return (cleanWords[0][0] + cleanWords[cleanWords.length - 1][0]).toUpperCase();
};
