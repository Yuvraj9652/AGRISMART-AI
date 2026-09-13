import React, { useState, useRef, useEffect } from 'react';
import { HERO_BG_IMAGE } from '../../constants/data';
import { predictDisease } from '../../services/api';
import { getUserScans, saveUserScan, getLatestUserScan } from '../../utils/userStore';

export default function DashboardTab({ user, onNavigate, onLaunchPrompt, onShowResult, onScanComplete }) {
  const initialLatest = getLatestUserScan(user?.email);

  const [studioImage, setStudioImage] = useState(() => initialLatest?.image || null);
  const [studioFilename, setStudioFilename] = useState(() => initialLatest?.filename || (initialLatest ? `${initialLatest.crop || 'crop'}_specimen.jpg` : ""));
  const [studioCrop, setStudioCrop] = useState(() => initialLatest?.crop || "tomato");
  const [studioGrowth, setStudioGrowth] = useState(() => initialLatest?.growthStage || "vegetative");
  const [studioNotes, setStudioNotes] = useState(() => initialLatest?.notes || "");
  const [isStudioAnalyzing, setIsStudioAnalyzing] = useState(false);
  const [studioHighlighted, setStudioHighlighted] = useState(false);
  const [savedScanToast, setSavedScanToast] = useState(false);
  const [studioResult, setStudioResult] = useState(() => initialLatest || null);
  const [recentScans, setRecentScans] = useState(() => getUserScans(user?.email).slice(0, 3));

  useEffect(() => {
    const latest = getLatestUserScan(user?.email);
    setRecentScans(getUserScans(user?.email).slice(0, 3));
    if (latest && !studioResult) {
      setStudioResult(latest);
      if (latest.image && !studioImage) setStudioImage(latest.image);
      if (latest.crop) setStudioCrop(latest.crop);
      if (latest.growthStage) setStudioGrowth(latest.growthStage);
    }
  }, [user?.email]);

  const totalScans = Math.max(
    Number(user?.totalScans ?? user?.total_scans ?? 0),
    getUserScans(user?.email).length
  );

  const fileInputRef = useRef(null);

  const handleStudioDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleStudioDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setStudioImage(evt.target.result);
        setStudioFilename(file.name);
        setStudioResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDemoScan = () => {
    if (studioResult && user?.email) {
      saveUserScan(user.email, { ...studioResult, image: studioImage, crop: studioCrop });
      setRecentScans(getUserScans(user.email).slice(0, 3));
    }
    setSavedScanToast(true);
    setTimeout(() => setSavedScanToast(false), 3000);
  };

  const scrollToStats = () => {
    const el = document.getElementById('farm-stats-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToDetectionStudio = () => {
    const el = document.getElementById('detection-studio');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setStudioImage(evt.target.result);
        setStudioFilename(file.name);
        setStudioResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetStudioDemo = () => {
    setStudioImage(null);
    setStudioFilename("");
    setStudioCrop("tomato");
    setStudioGrowth("vegetative");
    setStudioNotes("");
    setStudioResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runStudioPrediction = async () => {
    if (!studioImage) {
      fileInputRef.current?.click();
      return;
    }
    setIsStudioAnalyzing(true);
    try {
      const apiResult = await predictDisease(studioImage, studioCrop, studioGrowth, studioNotes);
      setIsStudioAnalyzing(false);
      const fullRecord = {
        ...apiResult,
        image: studioImage,
        crop: studioCrop,
        growthStage: studioGrowth,
        notes: studioNotes
      };
      setStudioResult(fullRecord);
      if (onScanComplete) {
        onScanComplete(fullRecord);
      } else if (user?.email) {
        saveUserScan(user.email, fullRecord);
      }
      setRecentScans(getUserScans(user?.email).slice(0, 3));
      setStudioHighlighted(true);
      setTimeout(() => setStudioHighlighted(false), 1500);
    } catch (err) {
      setIsStudioAnalyzing(false);
      setStudioHighlighted(true);
      setTimeout(() => setStudioHighlighted(false), 1500);
    }
  };

  return (
    <section className="tab-content space-y-8 animate-fade-in-up" id="tab-Dashboard">
      {/* HERO BANNER WITH FLOATING BADGES & SHIMMER */}
      <div className="relative overflow-hidden rounded-3xl bg-inverse-surface text-on-primary shadow-2xl transition-all duration-300 group">
        <div className="absolute inset-0 z-0 opacity-35 mix-blend-overlay">
          <img
            alt="AgriSmart AI Smart Farm Drone and Sensor Field"
            className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-1000"
            src={HERO_BG_IMAGE}
          />
        </div>
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary-container text-label-sm font-label-sm border border-emerald-400/40 shadow-sm animate-float">
              <span className="material-symbols-outlined text-sm animate-spin-slow" data-icon="smart_toy">smart_toy</span>
              <span>Hackathon Prototype · Computer Vision Pipeline</span>
            </div>
            <h1 className="text-headline-lg-mobile md:text-headline-xl font-headline-xl font-extrabold text-white tracking-tight leading-tight">
              Protect your crops with intelligent AI
            </h1>
            <p className="text-body-md md:text-body-lg font-body-lg text-emerald-100/90 leading-relaxed">
              Upload a crop leaf image and use AI to identify possible diseases and receive practical precautions.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                className="h-12 px-6 rounded-xl bg-primary-container hover:bg-[#14532d] text-white font-label-lg shadow-lg hover:shadow-[0_4px_25px_rgba(21,128,61,0.5)] flex items-center gap-2 transition-all duration-200 active:scale-95 relative overflow-hidden group/btn"
                onClick={scrollToDetectionStudio}
                type="button"
              >
                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent"></div>
                <span className="material-symbols-outlined group-hover/btn:rotate-12 transition-transform" data-icon="photo_camera">photo_camera</span>
                <span>Detect Crop Disease</span>
              </button>
              <button
                className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-label-lg border border-white/25 backdrop-blur-sm transition-all duration-200 active:scale-95 flex items-center gap-2 hover:border-white/40"
                onClick={scrollToStats}
                type="button"
              >
                <span className="material-symbols-outlined" data-icon="analytics">analytics</span>
                <span>View Dashboard</span>
              </button>
            </div>
          </div>

          {/* Right Stat Card with hover-lift & Glass effect */}
          <div className="bg-[#ffffff]/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-white flex flex-col gap-4 min-w-[280px] max-w-sm hover-lift shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-emerald-200 font-bold">Model Engine</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-emerald-300 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
                </span>
                <span>Model Ready</span>
              </div>
            </div>
            <div>
              <h3 className="text-headline-md font-headline-md font-bold leading-snug">AI Crop Disease Detection</h3>
              <p className="text-body-sm font-body-sm text-emerald-100 mt-1">Convolutional classifier for early foliar pathology recognition.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-emerald-100 hover:bg-white/20 transition-colors">Image-based classification</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-emerald-100 hover:bg-white/20 transition-colors">Confidence-aware predictions</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-emerald-100 font-mono hover:bg-white/20 transition-colors">Computer Vision Model</span>
            </div>
            <div className="text-xs text-emerald-200/90 border-t border-white/15 pt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">Model Ready: Ready to analyze crop images</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-STEP HOW RAPID DIAGNOSIS WORKS PROCESS CARDS */}
      <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-8 border border-[#14532d]/10 dark:border-emerald-800/30 shadow-sm space-y-5 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface dark:text-[#ecfdf5]">How Rapid Diagnosis Works</h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70">Step-by-step leaf triage via client upload &amp; neural classification</p>
          </div>
          <span className="text-label-sm font-label-sm px-3.5 py-1.5 rounded-full bg-[#ecfdf5] dark:bg-emerald-950/80 text-primary dark:text-primary-fixed border border-transparent dark:border-emerald-700/50 font-bold shadow-sm">
            Standard Pipeline
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Snap & Upload', desc: 'Upload a leaf photo via drag-and-drop or browse from camera/gallery.' },
            { step: '2', title: 'Computer Vision Inference', desc: 'Vision classifier isolates leaf symptoms & evaluates class probabilities.' },
            { step: '3', title: 'Instant Prediction', desc: 'Receives predicted disease class, confidence score, & severity level.' },
            { step: '4', title: 'Practical Precautions', desc: 'Review practical precautionary measures to mitigate crop damage.' }
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-2xl bg-[#f4f7f4] dark:bg-[#15271c] border border-[#14532d]/10 dark:border-emerald-800/30 flex flex-col gap-2.5 hover-lift group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-md shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                {item.step}
              </div>
              <p className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5] group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors">
                {item.title}
              </p>
              <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* PROMINENT INTERACTIVE DISEASE DETECTION & PREDICTION STUDIO */}
      <div className="space-y-4" id="detection-studio">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/10 dark:bg-primary-fixed/20 text-primary dark:text-primary-fixed text-xs font-bold uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-sm" data-icon="smart_toy">smart_toy</span>
              <span>Interactive Demo Stage</span>
            </div>
            <h2 className="text-headline-lg font-headline-lg font-extrabold text-on-surface dark:text-[#ecfdf5]">
              Disease Detection &amp; Prediction Studio
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70">
              Test the live computer vision pipeline with sample leaves or upload custom specimens.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3.5 py-2 rounded-xl border border-primary/40 dark:border-emerald-700/50 bg-white dark:bg-[#162a1e] text-primary dark:text-primary-fixed text-label-md hover:bg-surface-container dark:hover:bg-[#1d3827] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              onClick={resetStudioDemo}
              type="button"
            >
              <span className="material-symbols-outlined text-sm" data-icon="refresh">refresh</span>
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>

        {/* 2-COLUMN STUDIO WORKFLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Upload Leaf Image Area (5 cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 border border-[#14532d]/15 dark:border-emerald-800/30 shadow-md space-y-4 flex flex-col justify-between transition-colors duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shadow-sm">1</span>
                  <span>Upload Leaf Image</span>
                </h3>
                <span className="text-label-xs text-on-surface-variant dark:text-emerald-300/80 bg-[#f4f7f4] dark:bg-[#15271c] px-2.5 py-1 rounded-md">JPG / PNG (max 10MB)</span>
              </div>

              {/* Drag & Drop Zone */}
              <div
                className="border-2 border-dashed border-[#10b981] dark:border-emerald-600/60 bg-[#ecfdf5]/50 dark:bg-emerald-950/20 hover:bg-[#ecfdf5]/80 dark:hover:bg-emerald-950/40 rounded-2xl p-3 text-center transition-all relative group overflow-hidden"
                onDragOver={handleStudioDragOver}
                onDrop={handleStudioDrop}
              >
                {studioImage ? (
                  <div className="relative rounded-xl overflow-hidden bg-black/5 shadow-inner">
                    <img
                      alt="Macro leaf sample"
                      className="w-full h-56 object-cover rounded-lg transition-transform duration-500 group-hover:scale-[1.02]"
                      id="studio-leaf-img"
                      src={studioImage}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90"></div>
                    
                    {/* Filename Badge */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                      <span className="flex items-center gap-1 font-medium truncate">
                        <span className="material-symbols-outlined text-emerald-400 text-sm" data-icon="check_circle">check_circle</span>
                        <span id="studio-filename">{studioFilename || "specimen_image.jpg"}</span>
                      </span>
                      <button
                        className="bg-white/20 hover:bg-white/40 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm transition-all active:scale-95"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        Change image
                      </button>
                    </div>

                    {/* Holographic HUD Laser Overlay during inference */}
                    {isStudioAnalyzing && (
                      <>
                        <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] pointer-events-none"></div>
                        <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent shadow-[0_0_20px_#22c55e] animate-scanbeam z-20" id="studio-laser"></div>
                        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 z-20"></div>
                        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 z-20"></div>
                        <div className="absolute bottom-10 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 z-20"></div>
                        <div className="absolute bottom-10 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 z-20"></div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <div className="w-12 h-12 rounded-full border border-emerald-400/60 border-dashed animate-spin"></div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    className="h-56 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-white/60 dark:bg-[#0c1811] flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-[#122419] transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-primary dark:text-primary-fixed flex items-center justify-center mb-3 shadow-inner">
                      <span className="material-symbols-outlined text-3xl" data-icon="add_photo_alternate">add_photo_alternate</span>
                    </div>
                    <p className="text-label-md font-label-md font-bold text-on-surface dark:text-[#ecfdf5]">
                      Select or drop crop leaf photo
                    </p>
                    <p className="text-body-xs font-body-xs text-on-surface-variant dark:text-emerald-300/70 mt-1">
                      JPG, PNG or WebP up to 10MB
                    </p>
                    <button
                      type="button"
                      className="mt-3 px-3.5 py-1.5 rounded-xl bg-primary-container text-white text-xs font-semibold shadow-xs hover:bg-[#14532d] transition-all"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="studio-file-input"
                  onChange={handleFileChange}
                  type="file"
                />
              </div>

              {/* Controls Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">Target Crop</label>
                  <select
                    className="w-full h-11 rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 px-3 text-label-md text-on-surface dark:text-[#ecfdf5] focus:border-primary dark:focus:border-emerald-400 focus:ring-2 focus:ring-primary/20 transition-all"
                    id="studio-crop-select"
                    value={studioCrop}
                    onChange={(e) => setStudioCrop(e.target.value)}
                  >
                    <option value="tomato">Tomato (Solanum lycopersicum)</option>
                    <option value="potato">Potato (Solanum tuberosum)</option>
                    <option value="corn">Maize / Sweet Corn</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">Growth Stage (Optional)</label>
                  <select
                    className="w-full h-11 rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 px-3 text-label-md text-on-surface dark:text-[#ecfdf5] focus:border-primary dark:focus:border-emerald-400 focus:ring-2 focus:ring-primary/20 transition-all"
                    value={studioGrowth}
                    onChange={(e) => setStudioGrowth(e.target.value)}
                  >
                    <option value="seedling">Seedling stage</option>
                    <option value="vegetative">Vegetative canopy</option>
                    <option value="fruiting">Fruiting stage</option>
                    <option value="harvest">Maturity / Harvest</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">Field Observation Notes</label>
                <input
                  className="w-full h-10 rounded-xl bg-[#f4f7f4] dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 px-3 text-body-sm text-on-surface dark:text-[#ecfdf5] focus:border-primary dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#1c3627] focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g., Lower foliage spotted after morning dew."
                  type="text"
                  value={studioNotes}
                  onChange={(e) => setStudioNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Main CTA Button with Shimmer Sweep */}
            <div className="pt-3 border-t border-outline-variant/20 dark:border-emerald-900/30 space-y-2">
              <button
                className="w-full relative overflow-hidden h-13 py-3.5 px-4 rounded-2xl bg-primary-container hover:bg-[#14532d] text-white font-label-lg shadow-md hover:shadow-[0_4px_25px_rgba(21,128,61,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 group"
                disabled={isStudioAnalyzing}
                id="studio-analyze-btn"
                onClick={runStudioPrediction}
                type="button"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent"></div>
                {isStudioAnalyzing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg" data-icon="progress_activity">progress_activity</span>
                    <span>Classifying Foliage via /api/predict...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform" data-icon="psychology">psychology</span>
                    <span>Analyze Crop (POST /api/predict)</span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-between text-xs text-on-surface-variant dark:text-emerald-300/70 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Model Status: Ready</span>
                </span>
                <span className="font-mono">Endpoint: /api/predict</span>
              </div>
            </div>
          </div>

          {/* Right Panel: The Result Card (7 cols) with dynamic glow highlight */}
          <div
            className={`lg:col-span-7 bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-7 border border-[#14532d]/15 dark:border-emerald-800/30 shadow-md space-y-5 flex flex-col justify-between transition-all duration-500 ${
              studioHighlighted
                ? 'ring-4 ring-primary dark:ring-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-[1.01]'
                : ''
            }`}
            id="studio-result-card"
          >
            {studioResult ? (
              <div className="space-y-4">
                {/* Result Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 dark:border-emerald-900/30 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-on-surface-variant dark:text-emerald-300/70">Predicted Diagnosis</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ecfdf5] dark:bg-emerald-950/70 text-primary dark:text-primary-fixed border border-primary/30 dark:border-emerald-700/50">
                        Crop: {studioCrop.charAt(0).toUpperCase() + studioCrop.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-headline-md font-headline-md font-extrabold text-on-surface dark:text-[#ecfdf5] mt-1">
                      {studioResult.prediction || "Detected Foliar Anomaly"}
                    </h3>
                    <p className="text-xs italic text-on-surface-variant dark:text-emerald-300/70 font-mono">
                      {studioResult.pathogen || "Neural Foliar Classifier"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <div className="px-3.5 py-1.5 rounded-xl bg-[#fffbeb] dark:bg-amber-950/50 border border-[#f59e0b] dark:border-amber-600/60 text-[#92400e] dark:text-amber-300 text-label-md font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                      <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span>
                      <span>Diagnosis Completed</span>
                    </div>
                  </div>
                </div>

                {/* Confidence & Severity Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-[#ecfdf5] dark:bg-[#152a1d] border border-[#10b981]/30 dark:border-emerald-700/40 hover-lift">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm font-label-sm font-semibold text-[#065f46] dark:text-emerald-300">Prediction Confidence</span>
                      <span className="text-xs font-bold text-primary dark:text-primary-fixed bg-white dark:bg-[#0f1f15] px-2 py-0.5 rounded-md border border-primary/20 dark:border-emerald-700/40">Vision Classifier</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-headline-lg font-headline-lg font-extrabold text-primary dark:text-primary-fixed">
                        {Math.round((studioResult.confidence || 0.91) * 100)}%
                      </span>
                      <span className="text-xs font-semibold text-[#065f46] dark:text-emerald-300">AI Prediction Confidence</span>
                    </div>
                    <div className="w-full bg-white dark:bg-[#0c1811] h-2.5 rounded-full mt-2.5 overflow-hidden border border-primary/10 dark:border-emerald-800/30">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-primary-container h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.round((studioResult.confidence || 0.91) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#fffbeb] dark:bg-amber-950/30 border border-[#f59e0b]/40 dark:border-amber-700/40 hover-lift">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm font-label-sm font-semibold text-[#92400e] dark:text-amber-300">Severity Stage</span>
                      <span className="text-xs font-bold text-[#92400e] dark:text-amber-300 bg-white dark:bg-[#1a1103] px-2 py-0.5 rounded-md border border-[#f59e0b]/40 dark:border-amber-700/50">Foliar Lesions</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-headline-lg font-headline-lg font-extrabold text-[#b45309] dark:text-amber-400">
                        {studioResult.severity || "Moderate"}
                      </span>
                      <span className="text-xs font-semibold text-[#92400e] dark:text-amber-300">Assessed by model</span>
                    </div>
                    <div className="w-full bg-white dark:bg-[#1a1103] h-2.5 rounded-full mt-2.5 overflow-hidden border border-amber-200 dark:border-amber-800/40">
                      <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-1000" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Recommended Precautions List */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f4f7f4] dark:bg-[#15271c] border border-[#14532d]/10 dark:border-emerald-800/30 space-y-3">
                  <h4 className="text-label-md font-label-md font-bold text-on-surface dark:text-[#ecfdf5] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-lg" data-icon="checklist">checklist</span>
                    <span>Recommended Precautions</span>
                  </h4>
                  <ul className="space-y-2.5 text-body-sm font-body-sm text-on-surface dark:text-emerald-100">
                    {(studioResult.precautions || [
                      "Remove visibly affected lower leaves near the base to prevent spore release.",
                      "Avoid unnecessary overhead watering; switch strictly to drip delivery.",
                      "Monitor nearby plants daily for early sign of foliar lesions.",
                      "Consult local agricultural guidance if symptoms spread to upper canopy."
                    ]).map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 group/item">
                        <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-base mt-0.5 flex-shrink-0 group-hover/item:scale-125 transition-transform" data-icon="check_circle">check_circle</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              /* Awaiting scan zero-state */
              <div className="my-auto py-12 px-4 text-center space-y-5">
                <div className="w-18 h-18 rounded-3xl bg-emerald-100/80 dark:bg-emerald-950/60 text-primary dark:text-primary-fixed flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-900/20">
                  <span className="material-symbols-outlined text-4xl text-primary dark:text-primary-fixed" data-icon="biotech">biotech</span>
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-wider mb-1">
                    <span>Awaiting Specimen Analysis</span>
                  </div>
                  <h3 className="text-headline-md font-headline-md font-extrabold text-on-surface dark:text-[#ecfdf5]">
                    No Active Diagnosis
                  </h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70">
                    Upload a crop leaf specimen on the left and click <strong>Analyze Crop</strong> to trigger computer vision foliar diagnostics and treatment guidance.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-2">
                  <div className="p-3 rounded-xl bg-[#f4f7f4] dark:bg-[#14261b] border border-outline-variant/20 dark:border-emerald-800/30 text-left">
                    <span className="text-[11px] text-on-surface-variant dark:text-emerald-300/70 block">Confidence</span>
                    <span className="font-mono text-sm font-bold text-on-surface-variant dark:text-emerald-300/50">--%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f4f7f4] dark:bg-[#14261b] border border-outline-variant/20 dark:border-emerald-800/30 text-left">
                    <span className="text-[11px] text-on-surface-variant dark:text-emerald-300/70 block">Severity</span>
                    <span className="font-mono text-sm font-bold text-on-surface-variant dark:text-emerald-300/50">--</span>
                  </div>
                </div>
              </div>
            )}

            {/* Result Card Footer & Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  className="flex-1 py-3 px-4 rounded-xl bg-primary-container text-on-primary font-label-md flex items-center justify-center gap-1.5 shadow hover:bg-[#14532d] hover:shadow-lg transition-all active:scale-95"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base" data-icon="add_photo_alternate">add_photo_alternate</span>
                  <span>{studioImage ? "Analyze Another Image" : "Upload Leaf Photo"}</span>
                </button>
                {studioResult && (
                  <>
                    <button
                      className="py-3 px-4 rounded-xl bg-primary hover:bg-[#14532d] text-white font-label-md flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                      onClick={() => onShowResult && onShowResult(studioResult)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base" data-icon="visibility">visibility</span>
                      <span>Full Diagnostic Report</span>
                    </button>
                    <button
                      className="py-3 px-4 rounded-xl border border-primary dark:border-emerald-600 text-primary dark:text-primary-fixed font-label-md hover:bg-surface-container dark:hover:bg-[#162c1e] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      onClick={() => onNavigate('AI Farmer Assistant')}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base" data-icon="chat">chat</span>
                      <span>Ask AI Assistant</span>
                    </button>
                    <button
                      className="py-3 px-4 rounded-xl bg-white dark:bg-[#162a1e] border border-outline-variant/40 dark:border-emerald-700/40 text-on-surface-variant dark:text-emerald-200 hover:text-primary dark:hover:text-primary-fixed font-label-md flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                      onClick={handleSaveDemoScan}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base" data-icon={savedScanToast ? "check" : "save"}>
                        {savedScanToast ? "check" : "save"}
                      </span>
                      <span>{savedScanToast ? "Scan Saved!" : "Save Scan"}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Clear Mandatory Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2 leading-relaxed">
                <span className="material-symbols-outlined text-amber-700 dark:text-amber-400 text-base mt-0.5 flex-shrink-0 animate-bounce" data-icon="info">info</span>
                <span><strong>⚠️ AI-generated prediction:</strong> Results should be verified with appropriate agricultural expertise before treatment decisions.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HONEST HACKATHON DASHBOARD METRICS WITH HOVER-LIFT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="farm-stats-section">
        {[
          {
            label: 'Total Scans Executed',
            value: `${totalScans} ${totalScans === 1 ? 'Scan' : 'Scans'}`,
            sub: totalScans > 0 ? 'Telemetry actively recorded' : 'No scans executed yet',
            badge: totalScans > 0 ? 'Live Telemetry' : 'Zero State',
            isGreen: true
          },
          { label: 'Target Crop Support', value: 'Tomato, Potato, Corn', sub: 'Extensible model architecture', icon: 'forest' },
          { label: 'Inference Status', value: 'Ready', sub: 'Pipeline operational', badge: 'Benchmarked', isBlue: true },
          { label: 'Backend Status', value: 'POST /api/predict', sub: 'Mock schema compliant', badge: 'REST Ready', isGreen: true, isMono: true }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-surface-container-lowest dark:bg-[#112117] p-6 rounded-3xl border border-[#14532d]/10 dark:border-emerald-800/30 shadow-sm flex flex-col justify-between hover-lift group"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-md font-label-md text-on-surface-variant dark:text-emerald-300/80 font-medium">{stat.label}</span>
              {stat.icon ? (
                <span className="material-symbols-outlined text-primary dark:text-primary-fixed group-hover:scale-125 transition-transform" data-icon={stat.icon}>
                  {stat.icon}
                </span>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-label-sm ${
                  stat.isGreen
                    ? 'bg-[#ecfdf5] dark:bg-emerald-950/80 text-[#065f46] dark:text-emerald-300 border border-[#10b981] dark:border-emerald-700/50'
                    : 'bg-[#f0f9ff] dark:bg-sky-950/60 text-[#075985] dark:text-sky-300'
                }`}>
                  {stat.badge}
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className={`text-headline-lg font-headline-lg font-bold group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors ${
                stat.isMono ? 'font-mono text-headline-sm text-primary dark:text-primary-fixed' : 'text-on-surface dark:text-[#ecfdf5]'
              }`}>
                {stat.value}
              </span>
              <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70 mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI ASSISTANT PROTOTYPE CALLOUT */}
      <div className="bg-gradient-to-br from-white to-[#ecfdf5] dark:from-[#112117] dark:to-[#0d2618] rounded-3xl p-6 sm:p-8 border border-[#10b981]/30 dark:border-emerald-700/40 shadow-sm space-y-4 hover-lift">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-white flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
              <span className="material-symbols-outlined text-3xl" data-icon="smart_toy">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface dark:text-[#ecfdf5]">AgriSmart Assistant (Prototype)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Experimental LLM
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/80 mt-1">
                Have questions about your diagnostic result? Click any query pill below to test conversational disease mitigation guidance.
              </p>
            </div>
          </div>
          <button
            className="h-12 px-6 rounded-2xl bg-primary hover:bg-[#14532d] text-white font-label-md transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-md hover:shadow-lg active:scale-95 group"
            onClick={() => onNavigate('AI Farmer Assistant')}
            type="button"
          >
            <span>Open Assistant View</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
          </button>
        </div>

        {/* Suggested Prompt Pills with Interactive Hover Bounce */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <span className="text-label-sm font-label-sm text-on-surface-variant dark:text-emerald-300/70 font-medium mr-1">Suggested prompts:</span>
          {[
            "What does this disease mean?",
            "What precautions should I take?",
            "Explain this result simply",
            "How can I prevent this disease from spreading?"
          ].map((promptText, idx) => (
            <button
              key={idx}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#162a1e] border border-[#10b981]/40 dark:border-emerald-700/40 hover:border-primary hover:bg-[#ecfdf5] dark:hover:bg-[#1d3928] text-on-surface dark:text-[#ecfdf5] text-label-sm font-label-sm transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              onClick={() => onLaunchPrompt(promptText)}
              type="button"
            >
              "{promptText}"
            </button>
          ))}
        </div>
      </div>

      {/* RECENT SCAN RECORDS (TELEMETRY) */}
      <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-8 border border-[#14532d]/10 dark:border-emerald-800/30 shadow-sm space-y-5 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface dark:text-[#ecfdf5]">Recent Scan Records</h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70">Recent crop inspection telemetry and AI classification logs</p>
          </div>
          <button
            className="text-label-md font-label-md text-primary dark:text-primary-fixed hover:underline font-semibold hover:translate-x-0.5 transition-transform"
            onClick={() => onNavigate('Scan History')}
          >
            View Scan History →
          </button>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-2xl bg-[#f4f7f4] dark:bg-[#15271c] border border-dashed border-[#14532d]/20 dark:border-emerald-800/40 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-primary dark:text-primary-fixed flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl" data-icon="inventory_2">inventory_2</span>
            </div>
            <div className="space-y-1">
              <p className="text-label-lg font-bold text-on-surface dark:text-[#ecfdf5]">No Recent Scans Found</p>
              <p className="text-body-sm text-on-surface-variant dark:text-emerald-200/70 max-w-md mx-auto">
                You haven't scanned any crop specimens yet. Upload a leaf photo in the studio above to log your first diagnostic entry.
              </p>
            </div>
            <button
              type="button"
              onClick={scrollToDetectionStudio}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-label-sm font-semibold hover:bg-[#14532d] transition-colors"
            >
              <span className="material-symbols-outlined text-sm" data-icon="upload">upload</span>
              <span>Scan First Specimen</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="p-4 rounded-2xl bg-[#f4f7f4] dark:bg-[#15271c] border border-[#14532d]/10 dark:border-emerald-800/30 hover-lift cursor-pointer group"
                onClick={() => onShowResult && onShowResult(scan)}
              >
                <div className="flex gap-3.5">
                  <div className="overflow-hidden rounded-xl w-16 h-16 flex-shrink-0 border border-outline-variant/30 dark:border-emerald-800/40">
                    {scan.image ? (
                      <img
                        alt={scan.condition || scan.prediction}
                        className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500"
                        src={scan.image}
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container dark:bg-[#183424] flex items-center justify-center text-primary dark:text-primary-fixed">
                        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform" data-icon="energy_savings_leaf">energy_savings_leaf</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm font-label-sm text-on-surface-variant dark:text-emerald-300/70">Scan #{scan.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          scan.badgeType === 'warning'
                            ? 'bg-[#fffbeb] dark:bg-amber-950/50 text-[#92400e] dark:text-amber-300 border border-[#f59e0b] dark:border-amber-600/50'
                            : scan.badgeType === 'success'
                            ? 'bg-[#ecfdf5] dark:bg-emerald-950/70 text-[#065f46] dark:text-emerald-300 border border-[#10b981] dark:border-emerald-700/50'
                            : 'bg-[#fef2f2] dark:bg-red-950/40 text-[#991b1b] dark:text-red-300 border border-[#ef4444] dark:border-red-700/50'
                        }`}
                      >
                        {scan.badge || scan.severity || "Inspected"}
                      </span>
                    </div>
                    <p className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5] group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors truncate">
                      {scan.condition || scan.prediction}
                    </p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70 text-xs truncate">
                      {scan.crop ? `${scan.crop.charAt(0).toUpperCase() + scan.crop.slice(1)} Specimen` : (scan.subtext || "Crop Specimen")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#14532d]/10 dark:border-emerald-900/30 flex items-center justify-between text-label-sm font-label-sm">
                  <span className={`${scan.badgeType === 'error' ? 'text-error dark:text-red-400' : 'text-primary dark:text-primary-fixed'} font-bold`}>
                    {scan.confidence || "92%"} Confidence
                  </span>
                  <span className="text-on-surface-variant dark:text-emerald-200/80 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    {scan.badgeType === 'warning' ? 'Inspect' : scan.badgeType === 'success' ? 'Healthy Leaf' : 'Details'}
                    {scan.badgeType !== 'success' && (
                      <span className="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
