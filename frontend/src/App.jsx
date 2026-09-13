import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/tabs/DashboardTab';
import DetectionTab from './components/tabs/DetectionTab';
import ResultTab from './components/tabs/ResultTab';
import HistoryTab from './components/tabs/HistoryTab';
import AssistantTab from './components/tabs/AssistantTab';
import ProfilePage from './components/profile/ProfilePage';
import AuthLayout from './components/auth/AuthLayout';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import {
  CropRecommendationTab,
  SmartIrrigationTab,
  WeatherIntelligenceTab,
  SustainabilityTab,
  FarmSettingsTab
} from './components/tabs/PrototypeTabs';
import { getStoredUser, saveStoredUser, computeInitials, incrementUserScanCount, saveUserScan, getUserScans, getLatestUserScan } from './utils/userStore';
import { ROUTES, TAB_TO_PATH, PATH_TO_TAB } from './constants/routes';
import { getMeApi, logoutApi, updateProfileApi, incrementScansApi } from './services/api';

function MainLayout({ children, currentUser, darkMode, onToggleTheme, onLogout }) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = PATH_TO_TAB[location.pathname] || 'Dashboard';

  const handleNavigate = (tabName) => {
    const path = TAB_TO_PATH[tabName] || ROUTES.DASHBOARD;
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#f4f7f4] dark:bg-[#07110a] text-on-surface dark:text-[#ecfdf5] font-body-md antialiased selection:bg-surface-variant selection:text-primary min-h-screen flex flex-col transition-colors duration-200">
      <Header
        darkMode={darkMode}
        onNavigate={handleNavigate}
        onToggleDrawer={() => setIsMobileDrawerOpen(true)}
        onToggleTheme={onToggleTheme}
        user={currentUser}
      />

      <div className="flex-1 flex w-full max-w-[1440px] mx-auto overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          darkMode={darkMode}
          isMobileOpen={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
          onSelectTab={handleNavigate}
          onToggleTheme={onToggleTheme}
          user={currentUser}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 bg-[#f4f7f4] dark:bg-[#0a160e] transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();

  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [latestScanResult, setLatestScanResult] = useState(() => getLatestUserScan(getStoredUser()?.email));

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('agrismart_theme');
    if (saved !== null) return saved === 'dark';
    return typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Verify backend JWT session on startup
  useEffect(() => {
    async function verifySession() {
      try {
        const me = await getMeApi();
        if (me) {
          const localUser = getStoredUser();
          const localScans = getUserScans(me.email);
          const backendScans = me.total_scans ?? 0;
          const storedScans = Number(localUser?.totalScans ?? localUser?.total_scans ?? 0);
          const count = Math.max(backendScans, localScans.length, storedScans);

          const formattedUser = {
            totalScans: count,
            total_scans: count,
            accuracyBenchmark: count > 0 ? (localUser?.accuracyBenchmark && localUser.accuracyBenchmark !== "0%" ? localUser.accuracyBenchmark : "94.8%") : "0%",
            activePlots: count > 0 ? (localUser?.activePlots && localUser.activePlots !== "0 Plots" ? localUser.activePlots : "4 Plots") : "0 Plots",
            ...localUser,
            ...me,
            totalScans: count,
            total_scans: count,
            initials: computeInitials(me.name),
            isLoggedIn: true,
          };
          setCurrentUser(formattedUser);
          saveStoredUser(formattedUser);

          if (count > backendScans) {
            updateProfileApi({ total_scans: count }).catch(() => {});
          }

          const savedLatest = getLatestUserScan(me.email);
          if (savedLatest) {
            setLatestScanResult(savedLatest);
          }
        }
      } catch (err) {
        console.warn("Session verification note:", err);
      }
    }
    verifySession();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('agrismart_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('agrismart_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((p) => !p);

  const handleNavigate = (tabName) => {
    const path = TAB_TO_PATH[tabName] || ROUTES.DASHBOARD;
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchPrompt = (promptText) => {
    setPendingPrompt(promptText);
    navigate(ROUTES.ASSISTANT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteScan = (scanData) => {
    if (scanData) {
      setLatestScanResult(scanData);
      if (currentUser?.email) {
        saveUserScan(currentUser.email, scanData);
      }
      const updatedUser = incrementUserScanCount(currentUser, scanData);
      setCurrentUser(updatedUser);
      incrementScansApi().catch(() => {
        if (updatedUser?.totalScans) {
          updateProfileApi({ total_scans: updatedUser.totalScans }).catch(() => {});
        }
      });
    }
    navigate(ROUTES.RESULT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    saveStoredUser(updatedUser);
  };

  const handleLoginSuccess = (user) => {
    const localScans = getUserScans(user?.email);
    const backendScans = Number(user?.totalScans ?? user?.total_scans ?? 0);
    const scanCount = Math.max(backendScans, localScans.length);
    const formatted = {
      totalScans: scanCount,
      total_scans: scanCount,
      accuracyBenchmark: user?.accuracyBenchmark || (scanCount > 0 ? "94.8%" : "0%"),
      activePlots: user?.activePlots || (scanCount > 0 ? "4 Plots" : "0 Plots"),
      ...user,
      initials: computeInitials(user.name),
      isLoggedIn: true,
    };
    setCurrentUser(formatted);
    saveStoredUser(formatted);
    const savedLatest = getLatestUserScan(user?.email);
    if (savedLatest) setLatestScanResult(savedLatest);
    navigate(ROUTES.DASHBOARD);
  };

  const handleRegisterSuccess = (user) => {
    const formatted = {
      totalScans: 0,
      total_scans: 0,
      accuracyBenchmark: "0%",
      activePlots: "0 Plots",
      ...user,
      initials: computeInitials(user.name),
      isLoggedIn: true,
    };
    setCurrentUser(formatted);
    saveStoredUser(formatted);
    navigate(ROUTES.PROFILE);
  };

  const handleLogout = async () => {
    await logoutApi();
    const loggedOutUser = { ...currentUser, isLoggedIn: false };
    setCurrentUser(loggedOutUser);
    saveStoredUser(loggedOutUser);
    navigate(ROUTES.LOGIN);
  };

  const layoutProps = {
    currentUser,
    darkMode,
    onToggleTheme: toggleDarkMode,
    onLogout: handleLogout,
  };

  return (
    <Routes>

      <Route
        path={ROUTES.LOGIN}
        element={
          <AuthLayout
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
            onReturnToDashboard={() => navigate(ROUTES.DASHBOARD)}
          >
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => navigate(ROUTES.REGISTER)}
              onReturnToDashboard={() => navigate(ROUTES.DASHBOARD)}
            />
          </AuthLayout>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <AuthLayout
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
            onReturnToDashboard={() => navigate(ROUTES.DASHBOARD)}
          >
            <RegisterPage
              onRegisterSuccess={handleRegisterSuccess}
              onNavigateToLogin={() => navigate(ROUTES.LOGIN)}
              onReturnToDashboard={() => navigate(ROUTES.DASHBOARD)}
            />
          </AuthLayout>
        }
      />

      <Route
        path={ROUTES.DASHBOARD}
        element={
          <MainLayout {...layoutProps}>
            <DashboardTab
              user={currentUser}
              onLaunchPrompt={handleLaunchPrompt}
              onNavigate={handleNavigate}
              onScanComplete={(scanData) => {
                if (scanData) {
                  setLatestScanResult(scanData);
                  if (currentUser?.email) {
                    saveUserScan(currentUser.email, scanData);
                  }
                  const updatedUser = incrementUserScanCount(currentUser, scanData);
                  setCurrentUser(updatedUser);
                  incrementScansApi().catch(() => {
                    if (updatedUser?.totalScans) {
                      updateProfileApi({ total_scans: updatedUser.totalScans }).catch(() => {});
                    }
                  });
                }
              }}
              onShowResult={(result) => {
                if (result) setLatestScanResult(result);
                navigate(ROUTES.RESULT);
              }}
            />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.DETECTION}
        element={
          <MainLayout {...layoutProps}>
            <DetectionTab onCompleteScan={handleCompleteScan} />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.RESULT}
        element={
          <MainLayout {...layoutProps}>
            <ResultTab scanResult={latestScanResult} onNavigate={handleNavigate} />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.HISTORY}
        element={
          <MainLayout {...layoutProps}>
            <HistoryTab
              user={currentUser}
              onNavigate={handleNavigate}
              onShowResult={(result) => {
                setLatestScanResult(result);
                navigate(ROUTES.RESULT);
              }}
            />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.ASSISTANT}
        element={
          <MainLayout {...layoutProps}>
            <AssistantTab
              onClearPendingPrompt={() => setPendingPrompt(null)}
              pendingPrompt={pendingPrompt}
              scanResult={latestScanResult}
              user={currentUser}
            />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <MainLayout {...layoutProps}>
            <ProfilePage
              user={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.CROP_RECOMMENDATION}
        element={
          <MainLayout {...layoutProps}>
            <CropRecommendationTab onReturn={() => navigate(ROUTES.DASHBOARD)} />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.SMART_IRRIGATION}
        element={
          <MainLayout {...layoutProps}>
            <SmartIrrigationTab onReturn={() => navigate(ROUTES.DASHBOARD)} />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.WEATHER}
        element={
          <MainLayout {...layoutProps}>
            <WeatherIntelligenceTab onReturn={() => navigate(ROUTES.DASHBOARD)} />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.SUSTAINABILITY}
        element={
          <MainLayout {...layoutProps}>
            <SustainabilityTab onReturn={() => navigate(ROUTES.DASHBOARD)} />
          </MainLayout>
        }
      />
      <Route
        path={ROUTES.SETTINGS}
        element={
          <MainLayout {...layoutProps}>
            <FarmSettingsTab />
          </MainLayout>
        }
      />

      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}