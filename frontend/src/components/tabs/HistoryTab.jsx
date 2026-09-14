import React, { useState, useEffect } from 'react';
import { getUserScans } from '../../utils/userStore';

export default function HistoryTab({ user, onShowResult, onNavigate }) {
  const [scans, setScans] = useState(() => getUserScans(user?.email));
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    setScans(getUserScans(user?.email));
  }, [user?.email]);

  const filteredScans = scans.filter((scan) => {
    if (activeFilter === 'diseased') return scan.badgeType === 'warning' || scan.badgeType === 'error';
    if (activeFilter === 'healthy') return scan.badgeType === 'success';
    return true;
  });

  const diseasedCount = scans.filter(s => s.badgeType === 'warning' || s.badgeType === 'error').length;
  const healthyCount = scans.filter(s => s.badgeType === 'success').length;

  return (
    <section className="tab-content space-y-6 animate-fade-in-up" id="tab-Scan History">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-label-sm font-label-sm mb-2 shadow-sm">
            <span className="material-symbols-outlined text-sm" data-icon="history">history</span>
            <span>Inspection Log Telemetry</span>
          </div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface dark:text-[#ecfdf5] font-extrabold">
            Scan History Records
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant dark:text-emerald-200/80">
            Chronological records of foliar disease detections, model inferences, and diagnostic assessments.
          </p>
        </div>

        {/* Filter Pills */}
        {scans.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container dark:bg-[#162a1e] border border-outline-variant/30 dark:border-emerald-800/30">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-label-sm font-semibold transition-all duration-200 ${
                activeFilter === 'all'
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-on-surface-variant dark:text-emerald-300/70 hover:text-primary dark:hover:text-primary-fixed'
              }`}
            >
              All ({scans.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('diseased')}
              className={`px-3.5 py-1.5 rounded-xl text-label-sm font-semibold transition-all duration-200 ${
                activeFilter === 'diseased'
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-on-surface-variant dark:text-emerald-300/70 hover:text-primary dark:hover:text-primary-fixed'
              }`}
            >
              Diseased ({diseasedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('healthy')}
              className={`px-3.5 py-1.5 rounded-xl text-label-sm font-semibold transition-all duration-200 ${
                activeFilter === 'healthy'
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-on-surface-variant dark:text-emerald-300/70 hover:text-primary dark:hover:text-primary-fixed'
              }`}
            >
              Healthy ({healthyCount})
            </button>
          </div>
        )}
      </div>

      {/* Empty State when 0 scans */}
      {scans.length === 0 ? (
        <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-8 sm:p-14 border border-[#14532d]/15 dark:border-emerald-800/30 shadow-md text-center max-w-2xl mx-auto space-y-6 transition-all">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-primary dark:text-primary-fixed flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-900/20">
            <span className="material-symbols-outlined text-4xl animate-pulse" data-icon="manage_search">manage_search</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-headline-md font-headline-md font-extrabold text-on-surface dark:text-[#ecfdf5]">
              No Scan Records Found
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant dark:text-emerald-200/80 max-w-md mx-auto">
              You haven't conducted any crop inspections yet. Upload a leaf photo in Disease Detection to log your first automated diagnosis.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate && onNavigate('Disease Detection')}
              type="button"
              className="hover-lift active:scale-95 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-container to-[#14532d] hover:from-[#14532d] hover:to-[#0f3d21] text-white font-label-lg shadow-lg hover:shadow-xl transition-all"
            >
              <span className="material-symbols-outlined text-xl" data-icon="add_a_photo">add_a_photo</span>
              <span>Launch Disease Detection</span>
            </button>
          </div>
        </div>
      ) : (
        /* Record List Container */
        <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl border border-[#14532d]/15 dark:border-emerald-800/30 shadow-md overflow-hidden transition-colors duration-200">
          <div className="divide-y divide-outline-variant/20 dark:divide-emerald-900/30">
            {filteredScans.map((scan) => {
              const numericConfidence = parseInt(scan.confidence) || 90;
              return (
                <div
                  key={scan.id}
                  className="group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f4f7f4]/90 dark:hover:bg-[#162c1e]/70 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-emerald-500 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {/* Image with zoom and ring glow */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all shadow-sm">
                      {scan.image ? (
                        <img
                          alt={scan.condition}
                          className="w-full h-full object-cover group-hover:scale-115 group-hover:rotate-1 transition-transform duration-500"
                          src={scan.image}
                        />
                      ) : scan.badgeType === 'success' ? (
                        <div className="w-full h-full bg-surface-container dark:bg-[#183424] flex items-center justify-center text-primary dark:text-primary-fixed group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-3xl" data-icon="eco">eco</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-error dark:text-red-400 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-3xl" data-icon="coronavirus">coronavirus</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-label-lg font-label-lg font-bold text-on-surface dark:text-[#ecfdf5] group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors">
                          {scan.condition}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                            scan.badgeType === 'warning'
                              ? 'bg-[#fffbeb] dark:bg-amber-950/60 text-[#92400e] dark:text-amber-300 border border-[#f59e0b] dark:border-amber-600/50'
                              : scan.badgeType === 'success'
                              ? 'bg-[#ecfdf5] dark:bg-emerald-950/70 text-[#065f46] dark:text-emerald-300 border border-[#10b981] dark:border-emerald-700/50'
                              : 'bg-[#fef2f2] dark:bg-red-950/50 text-[#991b1b] dark:text-red-300 border border-[#ef4444] dark:border-red-700/50'
                          }`}
                        >
                          {scan.badge}
                        </span>
                      </div>
                      <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70">
                        Record #{scan.id} · Crop: <span className="font-semibold text-on-surface dark:text-[#ecfdf5] capitalize">{scan.crop || 'Crop'}</span> · Model: <span className="font-mono text-xs">{scan.model}</span>
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-xs text-stone-400 dark:text-emerald-300/50">Date: {scan.date || 'Recent'}</span>
                        <span className="text-stone-300 dark:text-stone-700">·</span>
                        <span className="text-xs text-primary dark:text-primary-fixed font-medium">Logged in Telemetry</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 self-end sm:self-center">
                    {/* Visual Confidence Bar */}
                    <div className="text-right min-w-[90px]">
                      <span className="text-label-sm font-label-sm text-on-surface-variant dark:text-emerald-300/80 block font-medium">Confidence</span>
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              scan.badgeType === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${numericConfidence}%` }}
                          ></div>
                        </div>
                        <span className={`text-label-md font-label-md font-bold ${scan.badgeType === 'error' ? 'text-error dark:text-red-400' : 'text-primary dark:text-primary-fixed'}`}>
                          {scan.confidence}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Button */}
                    <button
                      className="hover-lift active:scale-95 h-10 px-5 rounded-xl bg-gradient-to-r from-primary-container to-[#14532d] hover:from-[#14532d] hover:to-[#0f3d21] text-on-primary text-label-md font-label-md shadow-[0_4px_12px_rgba(16,185,129,0.25)] flex items-center gap-1.5 transition-all"
                      onClick={() => onShowResult(scan)}
                      type="button"
                    >
                      <span>View Diagnosis</span>
                      <span className="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
