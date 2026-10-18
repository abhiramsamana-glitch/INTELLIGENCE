import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { EmergencyModal } from "./components/common/EmergencyModal";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BMIPage } from "./pages/BMIPage";
import { SymptomCheckerPage } from "./pages/SymptomCheckerPage";
import { DietPlannerPage } from "./pages/DietPlannerPage";
import { FitnessPlannerPage } from "./pages/FitnessPlannerPage";
import { ReportAnalysisPage } from "./pages/ReportAnalysisPage";
import { HealthAssistantPage } from "./pages/HealthAssistantPage";
import { HealthHistoryPage } from "./pages/HealthHistoryPage";
import { GoalsPage } from "./pages/GoalsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PrivacyPage } from "./pages/PrivacyPage";

function AppContent() {
  const { user, isAuthenticated, isLoading, loginWithDemo } = useAuth();

  // Simple client-side routing
  const [currentPath, setCurrentPath] = useState<string>("/dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Initialize path from window hash if available, or default to landing if not logged in
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setCurrentPath(hash);
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/dashboard":
        return "Dashboard";
      case "/bmi":
        return "BMI & Body Metrics";
      case "/symptom-checker":
        return "AI Symptom Checker";
      case "/diet-planner":
        return "Diet & Nutrition";
      case "/fitness-planner":
        return "Fitness & Workouts";
      case "/report-analysis":
        return "Medical Report Analysis";
      case "/health-assistant":
        return "AI Health Assistant";
      case "/health-history":
        return "Health History & Analytics";
      case "/goals":
        return "Wellness Goals";
      case "/settings":
        return "Settings & Profile";
      case "/privacy":
        return "Privacy & Compliance";
      case "/auth":
        return "Sign In";
      default:
        return "HealthMate";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Initializing Health Vault...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and on landing page or auth
  if (!isAuthenticated && currentPath === "/") {
    return (
      <>
        <LandingPage
          onGetStarted={() => navigateTo("/auth")}
          onDemoAccess={async () => {
            await loginWithDemo();
            navigateTo("/dashboard");
          }}
          onOpenEmergency={() => setEmergencyOpen(true)}
        />
        <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      </>
    );
  }

  if (currentPath === "/auth" && !isAuthenticated) {
    return (
      <>
        <AuthPage
          onSuccess={() => navigateTo("/dashboard")}
          onBackToHome={() => navigateTo("/")}
        />
        <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      </>
    );
  }

  // If unauthenticated user tries to visit protected page directly, show friendly gate
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              HealthMate uses Row Level Security (RLS) to encrypt all measurements, symptoms, and medical reports. Please sign in or use the demo reviewer profile.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  await loginWithDemo();
                  navigateTo("/dashboard");
                }}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Launch Demo Reviewer Profile (Alex Rivera)
              </button>
              <button
                onClick={() => navigateTo("/auth")}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
              >
                Sign In with Email OTP
              </button>
              <button
                onClick={() => navigateTo("/")}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600"
              >
                Back to Home Page
              </button>
            </div>
          </div>
        </div>
        <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      </>
    );
  }

  // Render Protected Dashboard Layout
  const renderCurrentPage = () => {
    switch (currentPath) {
      case "/dashboard":
        return <DashboardPage onNavigate={navigateTo} onOpenEmergency={() => setEmergencyOpen(true)} />;
      case "/bmi":
        return <BMIPage />;
      case "/symptom-checker":
        return <SymptomCheckerPage onOpenEmergency={() => setEmergencyOpen(true)} />;
      case "/diet-planner":
        return <DietPlannerPage />;
      case "/fitness-planner":
        return <FitnessPlannerPage />;
      case "/report-analysis":
        return <ReportAnalysisPage />;
      case "/health-assistant":
        return <HealthAssistantPage />;
      case "/health-history":
        return <HealthHistoryPage />;
      case "/goals":
        return <GoalsPage />;
      case "/settings":
        return <SettingsPage />;
      case "/privacy":
        return <PrivacyPage />;
      default:
        return <DashboardPage onNavigate={navigateTo} onOpenEmergency={() => setEmergencyOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={navigateTo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar
          currentTitle={getPageTitle(currentPath)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenEmergency={() => setEmergencyOpen(true)}
          onNavigate={navigateTo}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Emergency modal global trigger */}
      <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
