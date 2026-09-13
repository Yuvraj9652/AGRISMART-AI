import React, { useState } from 'react';
import { DEFAULT_LEAF_IMAGE } from '../../constants/data';

export default function ResultTab({ scanResult, onNavigate }) {
  const [savedScanToast, setSavedScanToast] = useState(false);

  const handleSave = () => {
    setSavedScanToast(true);
    setTimeout(() => setSavedScanToast(false), 3000);
  };

  if (!scanResult) {
    return (
      <section className="tab-content space-y-6 animate-fade-in-up" id="tab-Disease-Result">
        {/* Breadcrumb navigation back */}
        <div className="flex items-center justify-between">
          <button
            className="inline-flex items-center gap-1.5 text-label-md font-label-md text-primary dark:text-primary-fixed hover:underline group"
            onClick={() => onNavigate('Dashboard')}
            type="button"
          >
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform" data-icon="arrow_back">arrow_back</span>
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Empty State Card */}
        <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-8 sm:p-12 border border-[#14532d]/15 dark:border-emerald-800/30 shadow-md text-center max-w-2xl mx-auto space-y-6 transition-all">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-primary dark:text-primary-fixed flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-900/20">
            <span className="material-symbols-outlined text-4xl animate-pulse" data-icon="biotech">biotech</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-headline-md font-headline-md font-extrabold text-on-surface dark:text-[#ecfdf5]">
              No Diagnostic Scan Executed
            </h2>
            <p className="text-body-md font-body-md text-on-surface-variant dark:text-emerald-200/80 max-w-md mx-auto">
              You haven't run any foliar disease detection yet. Upload a crop leaf photo to view detailed AI predictions, severity analysis, and mitigation steps.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('Disease Detection')}
              type="button"
              className="hover-lift active:scale-95 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-container to-[#14532d] hover:from-[#14532d] hover:to-[#0f3d21] text-white font-label-lg shadow-lg hover:shadow-xl transition-all"
            >
              <span className="material-symbols-outlined text-xl" data-icon="add_a_photo">add_a_photo</span>
              <span>Launch Disease Detection</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Active data source: passed scanResult
  const diseaseName = scanResult?.prediction || "Detected Foliar Anomaly";
  const cropName = scanResult?.crop || "Crop";
  const pathogenName = scanResult?.pathogen || "Pathogen";
  const severityLevel = scanResult?.severity || "Moderate";
  const confidenceScore = scanResult?.confidence_percentage || (scanResult?.confidence ? `${Math.round(scanResult.confidence * 100)}%` : "91%");
  const confidenceNum = Math.round((scanResult?.confidence || 0.91) * 100);
  const imageSrc = scanResult?.image || DEFAULT_LEAF_IMAGE;
  const precautions = scanResult?.precautions || [
    "Remove visibly affected lower leaves near the base to prevent spore release.",
    "Avoid unnecessary overhead watering; switch strictly to drip irrigation.",
    "Monitor nearby plants daily for early sign of concentric spot formation.",
    "Consult local agricultural guidance if symptoms spread to upper canopy."
  ];
  const isPlaceholder = scanResult?.is_placeholder ?? false;
  const modelArch = scanResult?.model_info?.architecture || "ResNet-50 Classifier";

  return (
    <section className="tab-content space-y-6 animate-fade-in-up" id="tab-Disease-Result">
      {/* Breadcrumb navigation back */}
      <div className="flex items-center justify-between">
        <button
          className="inline-flex items-center gap-1.5 text-label-md font-label-md text-primary dark:text-primary-fixed hover:underline group"
          onClick={() => onNavigate('Dashboard')}
          type="button"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform" data-icon="arrow_back">arrow_back</span>
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2.5">
          <button
            className="px-4 py-2 rounded-2xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 text-on-surface dark:text-[#ecfdf5] font-label-md flex items-center gap-1.5 hover:bg-surface-container dark:hover:bg-[#1c3627] transition-all shadow-sm active:scale-95 hover:shadow-md"
            onClick={handleSave}
            type="button"
          >
            <span className="material-symbols-outlined text-base text-primary dark:text-primary-fixed" data-icon={savedScanToast ? "check_circle" : "bookmark_add"}>
              {savedScanToast ? "check_circle" : "bookmark_add"}
            </span>
            <span>{savedScanToast ? "Scan Saved!" : "Save Demo Scan"}</span>
          </button>
          <button
            className="px-4 py-2 rounded-2xl bg-primary-container text-on-primary font-label-md flex items-center gap-1.5 shadow hover:bg-[#14532d] hover:shadow-lg transition-all active:scale-95"
            onClick={() => onNavigate('Disease Detection')}
            type="button"
          >
            <span className="material-symbols-outlined text-base" data-icon="add_photo_alternate">add_photo_alternate</span>
            <span>Analyze Another Image</span>
          </button>
        </div>
      </div>

      {/* Model Checkpoint Warning Badge if Placeholder */}
      {isPlaceholder && (
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-blue-600 text-base" data-icon="info">info</span>
            <span>ML Checkpoint Integration Adapter Mode: Showing response structure for .pth model integration.</span>
          </span>
          <span className="font-mono text-[11px] bg-white dark:bg-blue-900 px-2 py-0.5 rounded border">Pending model/weights/.pth</span>
        </div>
      )}

      {/* Alert Notification Bar with soft warning pulse */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#fffbeb] dark:bg-amber-950/40 border border-[#f59e0b] dark:border-amber-600/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#f59e0b] dark:bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-md animate-bounce">
            <span className="material-symbols-outlined text-2xl" data-icon="warning">warning</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-[#fef3c7] dark:bg-amber-900/60 text-[#92400e] dark:text-amber-200 border border-[#f59e0b] dark:border-amber-600/60 shadow-sm animate-pulse">
                Possible disease detected
              </span>
              <span className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-300/70">Crop: {cropName}</span>
            </div>
            <p className="text-label-lg font-label-lg font-bold text-[#92400e] dark:text-amber-300 mt-0.5">
              {diseaseName} ({pathogenName}) — {severityLevel} Severity
            </p>
          </div>
        </div>
        <button
          className="h-11 px-5 rounded-2xl bg-[#92400e] dark:bg-amber-700 text-white font-label-md flex items-center gap-2 flex-shrink-0 hover:bg-[#78350f] dark:hover:bg-amber-800 transition-colors shadow-md hover:shadow-lg active:scale-95"
          onClick={() => onNavigate('AI Farmer Assistant')}
          type="button"
        >
          <span className="material-symbols-outlined text-sm" data-icon="chat">chat</span>
          <span>Ask AI Assistant Prototype</span>
        </button>
      </div>

      {/* Main Diagnostic 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Analyzed Visual Sample (5 cols) with Pulsating Foliar Target Bounding Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 border border-[#14532d]/10 dark:border-emerald-800/30 shadow-md space-y-4 transition-colors duration-200 hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5]">Computer Vision Analysis</span>
              <span className="text-label-sm font-label-sm text-primary dark:text-primary-fixed font-bold bg-primary/10 dark:bg-primary-fixed/20 px-2.5 py-0.5 rounded-md">{modelArch}</span>
            </div>

            {/* Image with Animated Pulsating Bounding Box Overlay */}
            <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-black/40 border border-outline-variant/40 dark:border-emerald-800/40 flex items-center justify-center group">
              <img
                alt="Analyzed Crop Leaf Specimen"
                className="w-full max-h-[380px] object-cover rounded-xl group-hover:scale-105 transition-transform duration-700"
                src={imageSrc}
              />
              {/* Dynamic Lesion Target Bounding Box */}
              <div className="absolute top-[36%] left-[40%] w-[26%] h-[24%] border-2 border-dashed border-red-500 bg-red-500/20 rounded-lg pointer-events-none flex flex-col justify-between p-1 animate-target-box z-10">
                <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded w-fit uppercase tracking-wider shadow-sm">
                  Lesion Area
                </div>
                <div className="text-[9px] text-red-900 bg-white/90 font-mono px-1 rounded w-fit font-bold">
                  Concentric Spot
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-[11px] font-medium flex items-center gap-1.5 z-20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>{cropName} Leaflet Specimen</span>
              </div>
            </div>

            {/* Diagnostics Summary Strip */}
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 rounded-2xl bg-[#ecfdf5] dark:bg-[#152a1d] border border-[#14532d]/10 dark:border-emerald-700/40 hover-lift">
                <span className="text-label-sm font-label-sm text-on-surface-variant dark:text-emerald-300/80">Model Confidence</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-headline-md font-headline-md font-bold text-primary dark:text-primary-fixed">{confidenceScore}</span>
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Confidence</span>
                </div>
                <div className="w-full bg-surface-container-high dark:bg-[#0c1811] h-2 rounded-full mt-2 overflow-hidden border border-transparent dark:border-emerald-800/30">
                  <div className="bg-gradient-to-r from-emerald-500 to-primary-container h-full rounded-full" style={{ width: `${confidenceNum}%` }}></div>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#fffbeb] dark:bg-amber-950/30 border border-[#f59e0b]/30 dark:border-amber-700/40 hover-lift">
                <span className="text-label-sm font-label-sm text-[#92400e] dark:text-amber-300">Severity Stage</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-headline-md font-headline-md font-bold text-[#b45309] dark:text-amber-400">{severityLevel}</span>
                </div>
                <p className="text-[11px] font-medium text-[#92400e] dark:text-amber-300 mt-1">Foliar symptom spread</p>
              </div>
            </div>
          </div>

          {/* Clear Mandatory Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-amber-800 dark:text-amber-400 text-lg mt-0.5 flex-shrink-0 animate-bounce" data-icon="warning">warning</span>
            <p className="text-label-sm font-label-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>Disclaimer:</strong> {scanResult?.disclaimer || "⚠️ AI-generated prediction. Results should be verified with appropriate agricultural expertise before treatment decisions."}
            </p>
          </div>
        </div>

        {/* Right: Recommended Precautions & Practical Steps (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Disease Biology Card */}
          <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-7 border border-[#14532d]/10 dark:border-emerald-800/30 shadow-md space-y-3 transition-colors duration-200 hover-lift">
            <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-emerald-900/30 pb-3.5">
              <div>
                <h3 className="text-headline-md font-headline-md font-bold text-on-surface dark:text-[#ecfdf5]">{diseaseName}</h3>
                <p className="text-body-sm font-body-sm italic text-on-surface-variant dark:text-emerald-300/70 font-mono">{pathogenName}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-label-sm font-label-sm bg-[#fffbeb] dark:bg-amber-950/50 text-[#92400e] dark:text-amber-300 border border-[#f59e0b] dark:border-amber-600/50 font-bold">
                Identified Pathogen
              </span>
            </div>
            <p className="text-body-md font-body-md text-on-surface-variant dark:text-emerald-200/80 leading-relaxed">
              Characterized by foliar chlorosis and necrotic spot development. Prompt cultural management, foliage aeration, and drip irrigation help minimize upward canopy migration.
            </p>
          </div>

          {/* Practical Precautions */}
          <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-7 border border-[#14532d]/10 dark:border-emerald-800/30 shadow-md space-y-3.5 transition-colors duration-200">
            <h4 className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#d97706] dark:text-amber-400" data-icon="task_alt">task_alt</span>
              <span>Recommended Precautions</span>
            </h4>
            <div className="space-y-3">
              {precautions.map((stepText, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#f4f7f4] dark:bg-[#15271c] border border-[#14532d]/10 dark:border-emerald-800/30 flex items-start gap-3.5 hover:border-primary dark:hover:border-emerald-500 hover:shadow-sm transition-all group"
                >
                  <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-115 transition-transform">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-body-sm font-body-sm text-on-surface dark:text-emerald-100 group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors leading-relaxed">
                      {stepText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              className="flex-1 py-3.5 px-5 rounded-2xl bg-primary-container text-on-primary font-label-md flex items-center justify-center gap-2 shadow hover:bg-[#14532d] hover:shadow-lg transition-all active:scale-95"
              onClick={() => onNavigate('AI Farmer Assistant')}
              type="button"
            >
              <span className="material-symbols-outlined" data-icon="smart_toy">smart_toy</span>
              <span>Ask AI Assistant Prototype</span>
            </button>
            <button
              className="py-3.5 px-5 rounded-2xl border border-primary dark:border-emerald-600 text-primary dark:text-primary-fixed font-label-md hover:bg-surface-container dark:hover:bg-[#162c1e] flex items-center gap-2 transition-all shadow-sm active:scale-95"
              onClick={() => onNavigate('Disease Detection')}
              type="button"
            >
              <span className="material-symbols-outlined" data-icon="refresh">refresh</span>
              <span>Analyze Another Image</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
