import React, { useState, useRef } from 'react';
import { DEFAULT_LEAF_IMAGE } from '../../constants/data';
import { predictDisease } from '../../services/api';

export default function DetectionTab({ onCompleteScan }) {
  const [previewImg, setPreviewImg] = useState(null);
  const [filename, setFilename] = useState("");
  const [crop, setCrop] = useState("tomato");
  const [growthStage, setGrowthStage] = useState("vegetative");
  const [notes, setNotes] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPreviewImg(evt.target.result);
        setFilename(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPreviewImg(evt.target.result);
        setFilename(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetUpload = (e) => {
    if (e) e.stopPropagation();
    setPreviewImg(null);
    setFilename("");
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadSampleImage = () => {
    setPreviewImg(DEFAULT_LEAF_IMAGE);
    setFilename("tomato_early_blight_sample.jpg");
    setProgress(0);
    setIsScanning(false);
    setErrorMessage(null);
  };

  const startDiseaseScan = async () => {
    setIsScanning(true);
    setProgress(25);
    setErrorMessage(null);

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 200);

    try {
      const apiResult = await predictDisease(previewImg, crop, growthStage, notes);
      clearInterval(progressTimer);
      setProgress(100);

      setTimeout(() => {
        setIsScanning(false);
        onCompleteScan({ ...apiResult, image: previewImg, crop, growthStage });
      }, 400);

    } catch (err) {
      clearInterval(progressTimer);
      setIsScanning(false);
      setProgress(0);
      setErrorMessage(err.message || "Failed to connect to /api/predict server.");
    }
  };

  return (
    <section className="tab-content space-y-6 animate-fade-in-up" id="tab-Disease Detection">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-container text-on-primary text-label-sm font-label-sm mb-2 shadow-sm animate-float">
            <span className="material-symbols-outlined text-sm" data-icon="biotech">biotech</span>
            <span>ResNet-50 / PyTorch Vision Pipeline</span>
          </div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface dark:text-[#ecfdf5] font-extrabold">Autonomous Crop Disease Detection</h2>
          <p className="text-body-md font-body-md text-on-surface-variant dark:text-emerald-200/80">
            Upload crop leaf images for rapid classification, confidence calculations, and actionable precautionary steps.
          </p>
        </div>
        <button
          className="h-11 px-5 rounded-2xl border border-primary dark:border-emerald-600 text-primary dark:text-primary-fixed hover:bg-surface-container dark:hover:bg-[#162c1e] font-label-md flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95 group"
          onClick={loadSampleImage}
          type="button"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500" data-icon="restart_alt">restart_alt</span>
          <span>Load Validation Leaf Sample</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Area & Image Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-7 border border-[#14532d]/10 dark:border-emerald-800/30 shadow-md space-y-4 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <span className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5] block">1. Crop Foliage Photo</span>
              <span className="text-label-xs text-on-surface-variant dark:text-emerald-300/80 bg-[#f4f7f4] dark:bg-[#15271c] px-2.5 py-1 rounded-md">Demo Validation Set</span>
            </div>

            {/* Drag and Drop Upload Zone with HUD */}
            <div
              className="border-2 border-dashed border-[#10b981] dark:border-emerald-600/60 bg-[#ecfdf5]/40 dark:bg-emerald-950/20 hover:bg-[#ecfdf5]/70 dark:hover:bg-emerald-950/40 rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer relative group overflow-hidden"
              id="drop-zone"
              onClick={() => !previewImg && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                id="file-input"
                onChange={handleFile}
                type="file"
              />

              {!previewImg ? (
                <div className="flex flex-col items-center justify-center gap-2.5 py-4" id="upload-idle-state">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#162a1e] shadow-md flex items-center justify-center text-primary dark:text-primary-fixed group-hover:scale-115 group-hover:rotate-6 transition-all duration-300">
                    <span className="material-symbols-outlined text-3xl" data-icon="add_a_photo">add_a_photo</span>
                  </div>
                  <p className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5] mt-2">
                    Drag and drop leaf photo, or <span className="text-primary dark:text-primary-fixed underline">browse files</span>
                  </p>
                  <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70 max-w-sm">
                    Position the camera 10–20cm from the leaf. Avoid heavy glare or blurred framing.
                  </p>
                  <div className="flex items-center gap-3 text-label-xs text-on-surface-variant/80 dark:text-emerald-300/70 mt-1 font-mono">
                    <span>JPEG, PNG, WEBP</span>
                    <span>•</span>
                    <span>Max 10MB</span>
                  </div>
                </div>
              ) : (
                /* Preview State with Holographic Laser Scanning HUD */
                <div className="relative rounded-2xl overflow-hidden border border-outline-variant/40 dark:border-emerald-800/40 bg-black/5" id="upload-preview-state">
                  <img
                    alt="Uploaded Tomato Leaf for Analysis"
                    className="w-full max-h-80 object-contain mx-auto rounded-xl transition-transform duration-500 group-hover:scale-[1.01]"
                    id="leaf-preview-img"
                    src={previewImg}
                  />

                  {/* Interactive AI Scanning HUD Laser Overlay */}
                  {isScanning && (
                    <>
                      <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none"></div>
                      <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent shadow-[0_0_20px_#22c55e] animate-scanbeam z-20" id="scanner-laser"></div>
                      {/* Corner Target Reticles */}
                      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 z-20"></div>
                      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 z-20"></div>
                      <div className="absolute bottom-12 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 z-20"></div>
                      <div className="absolute bottom-12 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 z-20"></div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="w-14 h-14 rounded-full border-2 border-emerald-400/60 border-dashed animate-spin"></div>
                      </div>
                    </>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/70 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-white text-label-sm font-label-sm z-30">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-emerald-400 text-sm" data-icon="check_circle">check_circle</span>
                      <span id="preview-filename">{filename}</span>
                    </span>
                    <button
                      className="text-red-300 hover:text-red-100 flex items-center gap-1 transition-colors active:scale-95"
                      onClick={resetUpload}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm" data-icon="delete">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scanner Status Banner during inference with animated gradient bar */}
            {isScanning && (
              <div className="p-4 rounded-2xl bg-[#ecfdf5] dark:bg-[#132a1c] border border-[#10b981] dark:border-emerald-700/60 space-y-2.5 animate-slide-down" id="scanner-processing-banner">
                <div className="flex items-center justify-between">
                  <span className="text-label-md font-label-md font-bold text-[#065f46] dark:text-emerald-300 flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-lg" data-icon="progress_activity">progress_activity</span>
                    <span>ResNet-50 Classifier Running (POST /api/predict)...</span>
                  </span>
                  <span className="text-label-md font-bold text-primary dark:text-primary-fixed" id="scan-progress-percentage">{progress}%</span>
                </div>
                <div className="w-full bg-white dark:bg-[#0c1811] h-2.5 rounded-full overflow-hidden border border-transparent dark:border-emerald-800/40">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-primary-container h-full transition-all duration-300 rounded-full"
                    id="scan-progress-bar"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-label-sm font-label-sm text-[#065f46] dark:text-emerald-300 animate-pulse" id="scan-step-label">
                  Sending image payload to FastAPI /api/predict backend...
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 animate-fade-in-up">
                <span className="material-symbols-outlined text-base text-red-600" data-icon="error">error</span>
                <span><strong>API Error:</strong> {errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Parameters Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-7 border border-[#14532d]/10 dark:border-emerald-800/30 shadow-md space-y-4 transition-colors duration-200">
            <span className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5] block">2. Crop Classification Parameters</span>

            {/* Crop Selector */}
            <div className="space-y-1.5">
              <label className="text-label-md font-label-md font-bold text-on-surface dark:text-[#ecfdf5] flex items-center justify-between">
                <span>Target Crop Variety</span>
                <span className="text-primary dark:text-primary-fixed text-xs font-normal">Required</span>
              </label>
              <div className="relative">
                <select
                  className="w-full h-12 rounded-2xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 px-3.5 text-body-md font-body-md text-on-surface dark:text-[#ecfdf5] focus:border-primary dark:focus:border-emerald-400 focus:ring-2 focus:ring-primary/20 transition-all"
                  id="crop-select"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                >
                  <option value="tomato">Tomato (Solanum lycopersicum)</option>
                  <option value="corn">Maize / Sweet Corn</option>
                  <option value="potato">Potato (Solanum tuberosum)</option>
                </select>
              </div>
            </div>

            {/* Growth Stage Radio Cards with smooth selection */}
            <div className="space-y-1.5">
              <label className="text-label-md font-label-md font-bold text-on-surface dark:text-[#ecfdf5]">Crop Growth Stage (Context)</label>
              <div className="grid grid-cols-2 gap-2.5">
                {['seedling', 'vegetative', 'flowering', 'fruiting'].map((stage) => (
                  <label
                    key={stage}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all active:scale-95 ${
                      growthStage === stage
                        ? 'border-primary dark:border-emerald-500 bg-[#ecfdf5] dark:bg-[#152a1d] shadow-sm'
                        : 'border-outline-variant/40 dark:border-emerald-800/40 bg-[#f4f7f4] dark:bg-[#15271c] hover:border-primary/50'
                    }`}
                  >
                    <input
                      checked={growthStage === stage}
                      className="w-4 h-4 text-primary focus:ring-primary"
                      name="growth-stage"
                      onChange={() => setGrowthStage(stage)}
                      type="radio"
                      value={stage}
                    />
                    <span className={`text-label-sm font-label-sm ${growthStage === stage ? 'font-bold text-primary dark:text-primary-fixed' : 'dark:text-emerald-100'}`}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Field Notes Input */}
            <div className="space-y-1.5">
              <label className="text-label-md font-label-md font-bold text-on-surface dark:text-[#ecfdf5]">Field Observation Notes</label>
              <textarea
                className="w-full rounded-2xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 p-3.5 text-body-sm font-body-sm text-on-surface dark:text-[#ecfdf5] focus:border-primary dark:focus:border-emerald-400 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="e.g., Lower foliage spotted after morning dew."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* High-Visibility CTA with Shimmer */}
            <div className="pt-2">
              <button
                className="w-full relative overflow-hidden h-14 rounded-2xl bg-primary-container hover:bg-[#14532d] text-white font-label-lg shadow-lg hover:shadow-[0_4px_25px_rgba(21,128,61,0.4)] flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                disabled={isScanning || !previewImg}
                id="analyze-btn"
                onClick={startDiseaseScan}
                type="button"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent"></div>
                {isScanning ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl" data-icon="progress_activity">progress_activity</span>
                    <span>Analyzing Foliage...</span>
                  </>
                ) : !previewImg ? (
                  <>
                    <span className="material-symbols-outlined text-xl" data-icon="add_a_photo">add_a_photo</span>
                    <span>Please Upload a Leaf Image First</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform" data-icon="psychology">psychology</span>
                    <span>Analyze Crop (POST /api/predict)</span>
                  </>
                )}
              </button>
              <p className="text-center text-label-xs text-on-surface-variant/80 dark:text-emerald-300/70 mt-2 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary dark:text-primary-fixed" data-icon="verified">verified</span>
                <span>Student Hackathon Pipeline · In-memory model demo</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
