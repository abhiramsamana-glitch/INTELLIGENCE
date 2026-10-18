import React from "react";
import {
  LayoutDashboard,
  Scale,
  Stethoscope,
  Utensils,
  Dumbbell,
  FileText,
  Bot,
  History,
  Target,
  Settings,
  ShieldCheck,
  HeartPulse,
  X,
} from "lucide-react";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "BMI & Metrics", path: "/bmi", icon: Scale },
    { label: "AI Symptom Checker", path: "/symptom-checker", icon: Stethoscope },
    { label: "Diet & Nutrition", path: "/diet-planner", icon: Utensils },
    { label: "Fitness & Workouts", path: "/fitness-planner", icon: Dumbbell },
    { label: "Medical Report Analysis", path: "/report-analysis", icon: FileText },
    { label: "AI Health Assistant", path: "/health-assistant", icon: Bot },
    { label: "Health History", path: "/health-history", icon: History },
    { label: "Wellness Goals", path: "/goals", icon: Target },
    { label: "Settings & Profile", path: "/settings", icon: Settings },
    { label: "Privacy & Consent", path: "/privacy", icon: ShieldCheck },
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => handleItemClick("/dashboard")}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                HealthMate
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Wellness &amp; Health Hub</p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-900/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Security / HIPAA & RLS Status footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/30">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-slate-200">Private Health Vault</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                Row-Level Security Active. Your medical data is private and encrypted.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
