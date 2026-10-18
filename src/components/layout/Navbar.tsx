import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Bell,
  Menu,
  ShieldAlert,
  User,
  LogOut,
  Settings,
  HeartPulse,
  Sparkles,
  ChevronDown,
  Lock,
} from "lucide-react";

interface NavbarProps {
  currentTitle: string;
  onToggleSidebar: () => void;
  onOpenEmergency: () => void;
  onNavigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTitle,
  onToggleSidebar,
  onOpenEmergency,
  onNavigate,
}) => {
  const { user, isAuthenticated, logout, loginWithDemo } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200">
      {/* Left: Mobile menu toggle & page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="lg:hidden flex items-center gap-1.5 text-teal-600 font-bold text-base mr-2">
            <HeartPulse className="w-5 h-5" />
            <span>HealthMate</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Emergency quick button */}
        <button
          onClick={onOpenEmergency}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
          title="Emergency Symptoms Screener"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden sm:inline">Emergency Help</span>
          <span className="sm:hidden font-mono">911</span>
        </button>

        {/* Notifications Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Health Updates
                </span>
                <span className="text-[10px] text-teal-600 font-medium">3 New</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-teal-50/70 border border-teal-100 rounded-lg">
                  <p className="font-semibold text-teal-900">Hydration Milestone</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    You've reached 1,750 ml of your daily target today. 1 liter remaining!
                  </p>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <p className="font-semibold text-slate-800">Lab Analysis Stored</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Your recent lipid and metabolic biomarker report is securely encrypted.
                  </p>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <p className="font-semibold text-slate-800">Workout Schedule</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Upper Body routine scheduled for today. Ready to move?
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account State */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {user.fullName ? user.fullName[0] : user.email[0]}
              </div>
              <span className="hidden md:inline font-semibold">{user.fullName || user.email.split("@")[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate("/settings");
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Account &amp; Preferences
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate("/privacy");
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Privacy &amp; Data Rights
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={loginWithDemo}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Demo Access
            </button>
            <button
              onClick={() => onNavigate("/auth")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
