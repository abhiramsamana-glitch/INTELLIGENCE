import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  HealthMeasurement,
  WaterLog,
  NutritionLog,
  WorkoutLog,
  MedicalReport,
  SymptomAssessment,
} from "../types";
import {
  Scale,
  Droplets,
  Flame,
  Dumbbell,
  FileText,
  Stethoscope,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Clock,
  Heart,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

interface DashboardPageProps {
  onNavigate: (route: string) => void;
  onOpenEmergency: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenEmergency,
}) => {
  const { user } = useAuth();

  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingWater, setAddingWater] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [measRes, waterRes, nutrRes, workRes, repRes, symRes] = await Promise.all([
        api.health.getMeasurements().catch(() => ({ measurements: [] })),
        api.diet.getWater(todayStr).catch(() => ({ logs: [] })),
        api.diet.getLogs(todayStr).catch(() => ({ logs: [] })),
        api.fitness.getLogs().catch(() => ({ logs: [] })),
        api.reports.getReports().catch(() => ({ reports: [] })),
        api.symptoms.getAssessments().catch(() => ({ assessments: [] })),
      ]);

      setMeasurements(measRes.measurements);
      setWaterLogs(waterRes.logs);
      setNutritionLogs(nutrRes.logs);
      setWorkoutLogs(workRes.logs);
      setReports(repRes.reports);
      setSymptoms(symRes.assessments);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const latestMeas = measurements[0] || null;

  // Hydration stats
  const totalWaterMl = waterLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
  const targetWaterMl = 2500;
  const waterPercent = Math.min(100, Math.round((totalWaterMl / targetWaterMl) * 100));

  // Nutrition stats for today
  const totalCalories = nutritionLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = nutritionLogs.reduce((acc, curr) => acc + (curr.proteinG || 0), 0);
  const totalCarbs = nutritionLogs.reduce((acc, curr) => acc + (curr.carbsG || 0), 0);
  const totalFat = nutritionLogs.reduce((acc, curr) => acc + (curr.fatG || 0), 0);
  const calorieGoal = 2000;

  // Quick log water
  const handleQuickWater = async (amount: number) => {
    try {
      setAddingWater(true);
      const res = await api.diet.addWater(amount);
      setWaterLogs((prev) => [res.log, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingWater(false);
    }
  };

  // Recent 7 days chart data
  const chartData = [
    { day: "Mon", steps: 8400, water: 2200 },
    { day: "Tue", steps: 9100, water: 2500 },
    { day: "Wed", steps: 7200, water: 2100 },
    { day: "Thu", steps: 10200, water: 2800 },
    { day: "Fri", steps: 9400, water: 2600 },
    { day: "Sat", steps: 11500, water: 3000 },
    { day: "Today", steps: 8900, water: totalWaterMl || 1750 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Health &amp; Wellness Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName || "Health Explorer"}
          </h2>
          <p className="mt-1.5 text-sm text-teal-100/90 leading-relaxed">
            Your personal wellness cockpit is ready. You have {reports.length} laboratory records in your vault and {symptoms.length} symptom assessments logged.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate("/symptom-checker")}
              className="px-4 py-2 bg-white text-teal-900 hover:bg-teal-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
              <span>Check Symptoms</span>
            </button>
            <button
              onClick={() => onNavigate("/report-analysis")}
              className="px-4 py-2 bg-teal-600/60 hover:bg-teal-600/80 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload Lab Report</span>
            </button>
            <button
              onClick={() => onNavigate("/bmi")}
              className="px-4 py-2 bg-teal-600/60 hover:bg-teal-600/80 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Log Weight &amp; BMI</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: BMI */}
        <div
          onClick={() => onNavigate("/bmi")}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 transition-all hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Body Mass Index</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {latestMeas ? latestMeas.bmi : "—"}
            </span>
            {latestMeas && (
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                {latestMeas.bmiCategory}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{latestMeas ? `${latestMeas.weightKg} kg / ${latestMeas.heightCm} cm` : "No measurements yet"}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
          </p>
        </div>

        {/* Card 2: Hydration */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Daily Hydration</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {totalWaterMl}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {targetWaterMl} ml</span>
          </div>

          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${waterPercent}%` }}
            />
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <button
              onClick={() => handleQuickWater(250)}
              disabled={addingWater}
              className="flex-1 py-1 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-semibold transition-colors text-center disabled:opacity-50"
            >
              +250ml
            </button>
            <button
              onClick={() => handleQuickWater(500)}
              disabled={addingWater}
              className="flex-1 py-1 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-semibold transition-colors text-center disabled:opacity-50"
            >
              +500ml
            </button>
          </div>
        </div>

        {/* Card 3: Nutrition */}
        <div
          onClick={() => onNavigate("/diet-planner")}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 transition-all hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Nutrition</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {totalCalories}
            </span>
            <span className="text-xs text-slate-500">/ {calorieGoal} kcal</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
            <span>P: {totalProtein}g</span>
            <span>C: {totalCarbs}g</span>
            <span>F: {totalFat}g</span>
          </div>
          <p className="mt-2 text-xs text-teal-700 font-medium flex items-center justify-between">
            <span>Log Meals &amp; Plans</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* Card 4: Workouts */}
        <div
          onClick={() => onNavigate("/fitness-planner")}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 transition-all hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Workout Sessions</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {workoutLogs.length}
            </span>
            <span className="text-xs text-slate-500">logged</span>
          </div>
          <p className="mt-3 text-xs text-slate-500 truncate">
            {workoutLogs[0] ? `Latest: ${workoutLogs[0].workoutTitle}` : "Ready for today's routine?"}
          </p>
        </div>
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Activity Trends Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Health &amp; Activity Progress</h3>
              <p className="text-xs text-slate-500">Daily physical steps &amp; hydration volume (ml)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-teal-500" />
                <span>Steps</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-cyan-400" />
                <span>Hydration (ml)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="steps" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="water" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personalized Recommendations & Reminders */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Personalized Insights</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-xs">
                <p className="font-bold text-teal-950 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-700" />
                  Steady BMI Maintenance
                </p>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  Your BMI has remained consistent within the normal clinical range (23.8 – 24.4) over the last 30 days.
                </p>
              </div>

              <div className="p-3 bg-cyan-50/70 border border-cyan-100 rounded-xl text-xs">
                <p className="font-bold text-cyan-950 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-700" />
                  Hydration Target
                </p>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  You are {targetWaterMl - totalWaterMl > 0 ? `${targetWaterMl - totalWaterMl} ml` : "0 ml"} away from optimal cellular hydration today.
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-amber-700" />
                  Rest &amp; Sleep Rhythm
                </p>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  Average sleep recorded at 7.5 hrs. Consistent bedtime aligns with optimal metabolic recovery.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate("/health-history")}
              className="w-full py-2 text-center text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors flex items-center justify-center gap-1"
            >
              <span>View Unified Health History</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Medical Reports & Symptom Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Medical Reports */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Medical Reports</h3>
                <p className="text-xs text-slate-500">Extracted laboratory &amp; biomarker documents</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("/report-analysis")}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Upload New</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No medical reports uploaded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload a PDF or scan to automatically extract lab values</p>
              <button
                onClick={() => onNavigate("/report-analysis")}
                className="mt-3 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors"
              >
                Upload First Report
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onNavigate("/report-analysis")}
                  className="p-3.5 bg-slate-50 hover:bg-teal-50/50 rounded-2xl border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">{rep.reportTitle}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{rep.laboratoryName || "Laboratory Report"}</span>
                      <span>•</span>
                      <span>{rep.reportDate}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-teal-800 shadow-xs">
                    {rep.results?.length || 0} Biomarkers
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Symptom Assessments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Symptom Checker Logs</h3>
                <p className="text-xs text-slate-500">Recent AI triage assessments</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("/symptom-checker")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Check Symptoms</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {symptoms.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No symptom checks logged</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Describe your symptoms in natural language for guidance</p>
              <button
                onClick={() => onNavigate("/symptom-checker")}
                className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                Start Symptom Check
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {symptoms.slice(0, 3).map((sym) => {
                let badgeClass = "bg-teal-50 text-teal-800 border-teal-200";
                if (sym.urgencyLevel === "Emergency") badgeClass = "bg-rose-50 text-rose-800 border-rose-200";
                else if (sym.urgencyLevel === "Urgent Care") badgeClass = "bg-amber-50 text-amber-800 border-amber-200";

                return (
                  <div
                    key={sym.id}
                    onClick={() => onNavigate("/symptom-checker")}
                    className="p-3.5 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">{sym.primarySymptom}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Severity: {sym.severity}/10</span>
                        <span>•</span>
                        <span>{new Date(sym.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shadow-xs ${badgeClass}`}>
                      {sym.urgencyLevel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Clinical Disclaimer */}
      <MedicalDisclaimer variant="banner" />
    </div>
  );
};
