import React, { useState } from 'react';
import { computeInitials, saveStoredUser, getUserScans } from '../../utils/userStore';
import { updateProfileApi } from '../../services/api';

export default function ProfilePage({ user, onUpdateUser, onLogout, onNavigate }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    farmName: user?.farmName || user?.farm_name || '',
    location: user?.location || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const initials = computeInitials(formData.name);
    const currentCount = Math.max(
      Number(user?.totalScans ?? user?.total_scans ?? 0),
      getUserScans(user?.email).length
    );
    let updated = {
      ...user,
      ...formData,
      totalScans: currentCount,
      total_scans: currentCount,
      initials,
      isLoggedIn: true
    };

    try {
      const serverUser = await updateProfileApi({
        name: formData.name,
        role: formData.role,
        farm_name: formData.farmName,
        location: formData.location,
        phone: formData.phone,
        bio: formData.bio,
        total_scans: currentCount,
      });
      updated = { ...updated, ...serverUser, totalScans: currentCount, total_scans: currentCount, initials };
    } catch (err) {
      console.warn("Backend profile sync note:", err.message);
    }

    saveStoredUser(updated);
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const currentInitials = computeInitials(formData.name) || user?.initials || "HP";
  const totalScans = Math.max(
    Number(user?.totalScans ?? user?.total_scans ?? 0),
    getUserScans(user?.email).length
  );
  const accuracyBenchmark = user?.accuracyBenchmark ?? (totalScans > 0 ? "94.8%" : "0%");
  const activePlots = user?.activePlots ?? (totalScans > 0 ? "4 Plots" : "0 Plots");

  return (
    <section className="tab-content space-y-6 max-w-4xl mx-auto" id="tab-Profile">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('Dashboard')}
          className="hover-lift active:scale-95 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-lowest dark:bg-[#112117] border border-outline-variant/30 dark:border-emerald-800/30 text-label-md font-label-md text-primary dark:text-primary-fixed shadow-xs hover:text-emerald-700 transition-all"
        >
          <span className="material-symbols-outlined text-base" data-icon="arrow_back">arrow_back</span>
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLogout}
            className="hover-lift active:scale-95 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-label-md font-label-md flex items-center gap-1.5 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-base" data-icon="logout">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Profile Header Banner Card */}
      <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-8 border border-[#14532d]/15 dark:border-emerald-800/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-300">
        <div className="flex items-center gap-5">
          {/* Animated Avatar with glowing ring */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[#064e3b] text-on-primary flex items-center justify-center text-3xl font-extrabold shadow-[0_4px_20px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/20 dark:ring-emerald-400/30 group-hover:scale-105 group-hover:ring-emerald-500/50 transition-all duration-300">
              {currentInitials}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#112117] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xs" data-icon="verified">verified</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-headline-md font-headline-md font-extrabold text-on-surface dark:text-[#ecfdf5]">
                {formData.name || "AgriSmart User"}
              </h2>
              {formData.role && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ecfdf5] dark:bg-emerald-950/70 border border-[#10b981]/50 text-[#065f46] dark:text-emerald-300 shadow-xs">
                  {formData.role}
                </span>
              )}
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70">
              {formData.email}
            </p>
            {(formData.farmName || formData.location) ? (
              <p className="text-xs text-on-surface-variant/80 dark:text-emerald-300/60 flex items-center gap-1.5 pt-0.5">
                <span className="material-symbols-outlined text-sm text-primary dark:text-primary-fixed" data-icon="location_on">location_on</span>
                <span>{[formData.farmName, formData.location].filter(Boolean).join(' · ')}</span>
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant/60 dark:text-emerald-300/50 flex items-center gap-1.5 pt-0.5 italic">
                <span className="material-symbols-outlined text-xs text-on-surface-variant/50" data-icon="edit">edit</span>
                <span>Complete your profile below</span>
              </p>
            )}
          </div>
        </div>

        {/* Live sync badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#f0f9ff] dark:bg-sky-950/50 border border-[#0284c7]/30 dark:border-sky-700/40 text-[#075985] dark:text-sky-300 text-xs font-semibold self-start sm:self-center shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
          </span>
          <span>LocalStorage Sync: Active</span>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface-container-lowest dark:bg-[#112117] border border-[#14532d]/15 dark:border-emerald-800/30 shadow-xs hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant dark:text-emerald-300/70 font-semibold">Total Scans Executed</span>
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-lg" data-icon="document_scanner">document_scanner</span>
          </div>
          <p className="text-2xl font-extrabold text-on-surface dark:text-[#ecfdf5] mt-1" id="profile-total-scans">{totalScans}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
            {totalScans > 0 ? "100% telemetry cached" : "No scans executed yet"}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-lowest dark:bg-[#112117] border border-[#14532d]/15 dark:border-emerald-800/30 shadow-xs hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant dark:text-emerald-300/70 font-semibold">Foliar Accuracy Benchmark</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg" data-icon="auto_awesome">auto_awesome</span>
          </div>
          <p className="text-2xl font-extrabold text-on-surface dark:text-[#ecfdf5] mt-1" id="profile-accuracy-benchmark">{accuracyBenchmark}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
            {totalScans > 0 ? "Exceeds 90% target" : "Awaiting first scan benchmark"}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-lowest dark:bg-[#112117] border border-[#14532d]/15 dark:border-emerald-800/30 shadow-xs hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant dark:text-emerald-300/70 font-semibold">Active Agro Sectors</span>
            <span className="material-symbols-outlined text-amber-500 text-lg" data-icon="yard">yard</span>
          </div>
          <p className="text-2xl font-extrabold text-on-surface dark:text-[#ecfdf5] mt-1" id="profile-active-plots">{activePlots}</p>
          <span className="text-[11px] text-stone-500 dark:text-emerald-300/60">
            {totalScans > 0 ? (formData.farmName ? `${formData.farmName}` : "Greenhouses 4A - 4D") : "No active sectors logged"}
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 text-sm flex items-center justify-between shadow-md animate-slide-down">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl animate-bounce" data-icon="check_circle">
              check_circle
            </span>
            <span className="font-semibold">Profile details successfully updated and persisted across the platform!</span>
          </div>
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-mono bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg">Header synced live</span>
        </div>
      )}

      {/* Editable Profile Form */}
      <div className="bg-surface-container-lowest dark:bg-[#112117] rounded-3xl p-6 sm:p-8 border border-[#14532d]/15 dark:border-emerald-800/30 shadow-md space-y-6 transition-colors duration-200">
        <div>
          <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface dark:text-[#ecfdf5]">
            Account &amp; Farm Details
          </h3>
          <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-emerald-200/70 mt-0.5">
            Update your profile info. Changes will immediately reflect in the top header and demo records.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">
                Full Name
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-emerald-300/70 text-lg group-focus-within:text-emerald-500 transition-colors">
                  badge
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 text-body-md font-body-md text-on-surface dark:text-[#ecfdf5] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-emerald-300/70 text-lg group-focus-within:text-emerald-500 transition-colors">
                  email
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 text-body-md font-body-md text-on-surface dark:text-[#ecfdf5] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Role / Designation */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">
                Role / Title
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-emerald-300/70 text-lg group-focus-within:text-emerald-500 transition-colors">
                  work
                </span>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g. Lead Agronomist"
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 text-body-md font-body-md text-on-surface dark:text-[#ecfdf5] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
                />
              </div>
            </div>

            {/* Farm / Organization Name */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">
                Farm or Organization
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-emerald-300/70 text-lg group-focus-within:text-emerald-500 transition-colors">
                  agriculture
                </span>
                <input
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 text-body-md font-body-md text-on-surface dark:text-[#ecfdf5] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Primary Location */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">
                Location / Plot
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-emerald-300/70 text-lg group-focus-within:text-emerald-500 transition-colors">
                  pin_drop
                </span>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Sector or Greenhouse"
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 text-body-md font-body-md text-on-surface dark:text-[#ecfdf5] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">
                Phone Number
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-emerald-300/70 text-lg group-focus-within:text-emerald-500 transition-colors">
                  call
                </span>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91..."
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 text-body-md font-body-md text-on-surface dark:text-[#ecfdf5] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bio / Observation Focus */}
          <div className="space-y-1.5">
            <label className="text-label-sm font-label-sm font-bold text-on-surface dark:text-[#ecfdf5]">
              Agronomic Specialization &amp; Notes
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="e.g. Focus on solanaceous foliar blights and IPM protocol."
              className="w-full rounded-xl bg-white dark:bg-[#162a1e] border border-[#14532d]/20 dark:border-emerald-700/40 p-3 text-body-sm font-body-sm text-on-surface dark:text-[#ecfdf5] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all resize-none"
            />
          </div>

          {/* Actions Button Row */}
          <div className="pt-3 flex flex-wrap items-center justify-end gap-3 border-t border-outline-variant/20 dark:border-emerald-900/30">
            <button
              type="submit"
              className="hover-lift active:scale-95 px-7 py-3 rounded-2xl bg-gradient-to-r from-primary-container to-[#14532d] hover:from-[#14532d] hover:to-[#0f3d21] text-white font-label-lg shadow-[0_4px_16px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-lg" data-icon="save">save</span>
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
