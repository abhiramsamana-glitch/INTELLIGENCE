import React, { useState } from "react";
import {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Utensils,
  Dumbbell,
  FileText,
  Activity,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
} from "lucide-react";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

interface LandingPageProps {
  onGetStarted: () => void;
  onDemoAccess: () => void;
  onOpenEmergency: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onDemoAccess,
  onOpenEmergency,
}) => {
  // Live interactive BMI calculator preview in the Hero section
  const [heroWeight, setHeroWeight] = useState("72");
  const [heroHeight, setHeroHeight] = useState("175");
  const [heroUnit, setHeroUnit] = useState<"metric" | "imperial">("metric");

  const calcHeroBMI = () => {
    const w = parseFloat(heroWeight);
    const h = parseFloat(heroHeight);
    if (!w || !h) return null;

    let bmi = 0;
    if (heroUnit === "metric") {
      const hm = h / 100;
      bmi = w / (hm * hm);
    } else {
      bmi = (w / (h * h)) * 703;
    }
    return parseFloat(bmi.toFixed(1));
  };

  const heroBmi = calcHeroBMI();
  let bmiCategory = "Normal weight";
  let bmiColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (heroBmi) {
    if (heroBmi < 18.5) {
      bmiCategory = "Underweight";
      bmiColor = "text-blue-700 bg-blue-50 border-blue-200";
    } else if (heroBmi < 25) {
      bmiCategory = "Normal weight";
      bmiColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (heroBmi < 30) {
      bmiCategory = "Overweight";
      bmiColor = "text-amber-700 bg-amber-50 border-amber-200";
    } else {
      bmiCategory = "Obese range";
      bmiColor = "text-rose-700 bg-rose-50 border-rose-200";
    }
  }

  const features = [
    {
      icon: Stethoscope,
      title: "AI Symptom Checker",
      desc: "Conversational evaluation that identifies warning signs, provides clinical triage levels, and suggests clear questions to discuss with your doctor.",
      tag: "Clinical Triage",
    },
    {
      icon: FileText,
      title: "Lab Report OCR & Analysis",
      desc: "Upload PDF or image laboratory reports. Multimodal AI extracts test names, reference ranges, and flags out-of-range biomarkers in clear language.",
      tag: "Multimodal OCR",
    },
    {
      icon: Utensils,
      title: "Smart Nutrition & Diet",
      desc: "Custom daily meal plans respecting dietary patterns, calorie goals, and strict food allergy exclusions with transparent macro estimates.",
      tag: "Allergy-Safe",
    },
    {
      icon: Dumbbell,
      title: "Adaptive Fitness Plans",
      desc: "Workouts tailored to your experience level, available equipment, and physical limitations with lower-impact modifications.",
      tag: "Personalized",
    },
    {
      icon: Activity,
      title: "Holistic Health Tracking",
      desc: "Track BMI, hydration, blood pressure, sleep, and activity with longitudinal charts and clean historical trends.",
      tag: "Recharts Visuals",
    },
    {
      icon: ShieldCheck,
      title: "Private & Encrypted",
      desc: "Strict Row Level Security (RLS) ensures that only you can access your medical records and lab files. Full GDPR export and account deletion.",
      tag: "RLS Enforced",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top landing navigation */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">HealthMate</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Health &amp; Wellness
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenEmergency}
              className="text-xs font-bold text-rose-700 hover:text-rose-800 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors hidden sm:block"
            >
              Emergency 911
            </button>
            <button
              onClick={onDemoAccess}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Demo Access
            </button>
            <button
              onClick={onGetStarted}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Mission & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-900 text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Evidence-Grounded AI Health &amp; Wellness Platform
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                Understand your body. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                  Track your wellness with confidence.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                HealthMate empowers you with conversational AI symptom triage, automated lab biomarker extraction, allergy-safe nutrition plans, and personalized workout routines — all secured in a private, encrypted vault.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={onGetStarted}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-700/20 transition-all group"
                >
                  <span>Get Started with Email OTP</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={onDemoAccess}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Launch Live Demo Profile</span>
                </button>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Passwordless 6-Digit Email OTP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-teal-600" />
                  <span>Row Level Security (RLS)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>HIPAA/GDPR Data Rights</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live BMI Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/60 border border-slate-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Instant BMI Calculator</h2>
                      <p className="text-[11px] text-slate-500">Live clinical screening estimate</p>
                    </div>
                  </div>
                  {/* Metric / Imperial toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => {
                        setHeroUnit("metric");
                        setHeroWeight("72");
                        setHeroHeight("175");
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        heroUnit === "metric" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      kg / cm
                    </button>
                    <button
                      onClick={() => {
                        setHeroUnit("imperial");
                        setHeroWeight("160");
                        setHeroHeight("69");
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        heroUnit === "imperial" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      lbs / in
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Weight ({heroUnit === "metric" ? "kg" : "lbs"})
                      </label>
                      <input
                        type="number"
                        value={heroWeight}
                        onChange={(e) => setHeroWeight(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Height ({heroUnit === "metric" ? "cm" : "inches"})
                      </label>
                      <input
                        type="number"
                        value={heroHeight}
                        onChange={(e) => setHeroHeight(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {heroBmi && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Calculated Body Mass Index
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
                        {heroBmi}
                      </div>
                      <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-xs">
                        <span className={`px-2 py-0.5 rounded-full ${bmiColor}`}>{bmiCategory}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                        Conventional adult healthy reference interval: <strong>18.5 – 24.9</strong>
                      </p>
                    </div>
                  )}

                  <button
                    onClick={onGetStarted}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Save to Health History</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <p className="text-[10px] text-slate-400 text-center leading-tight">
                    *BMI is a general screening metric and does not distinguish between lean muscle mass and fat tissue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-3">
              Comprehensive Health &amp; Wellness Intelligence
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Everything you need to track vital health indicators, decode complex laboratory paperwork, and build sustainable daily wellness habits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl p-6 border border-slate-200 hover:border-teal-300 transition-all hover:shadow-lg hover:shadow-teal-900/5 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works 3-step section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-950">How HealthMate Works</h2>
            <p className="text-xs text-slate-600 mt-1">Simple, private, and designed for everyday health tracking</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center relative">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Instant Passwordless Login</h3>
              <p className="text-xs text-slate-600">
                Sign in with a simple 6-digit email code. No passwords to remember or compromise.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center relative">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Log Metrics &amp; Upload Reports</h3>
              <p className="text-xs text-slate-600">
                Track hydration, meals, and workouts, or drop in PDF/image blood reports for instant OCR breakdown.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center relative">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Act with Confidence</h3>
              <p className="text-xs text-slate-600">
                Receive non-diagnostic triage guidance, questions to ask your physician, and personalized daily routines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Disclaimer & Emergency Banner */}
      <section className="py-8 bg-amber-50/60 border-y border-amber-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <MedicalDisclaimer variant="banner" />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <HeartPulse className="w-5 h-5 text-teal-400" />
            <span>HealthMate</span>
            <span className="text-slate-500 font-normal ml-2">© 2026 HealthMate Inc.</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => onGetStarted()} className="hover:text-white transition-colors">
              Sign In
            </button>
            <button onClick={onDemoAccess} className="hover:text-white transition-colors">
              Demo Profile
            </button>
            <button onClick={onOpenEmergency} className="text-rose-400 hover:text-rose-300 transition-colors">
              Emergency Numbers
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
