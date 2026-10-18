import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  HealthMeasurement,
  SymptomAssessment,
  MedicalReport,
  NutritionLog,
  WorkoutLog,
  WaterLog,
} from "../types";
import {
  History,
  Scale,
  Stethoscope,
  FileText,
  Utensils,
  Dumbbell,
  Droplets,
  Trash2,
  Calendar,
  Filter,
  Download,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

export const HealthHistoryPage: React.FC = () => {
  const { user, exportData } = useAuth();

  const [activeFilter, setActiveFilter] = useState<
    "all" | "measurements" | "symptoms" | "reports" | "nutrition" | "workouts"
  >("all");

  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomAssessment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [measRes, symRes, repRes, nutrRes, workRes] = await Promise.all([
        api.health.getMeasurements().catch(() => ({ measurements: [] })),
        api.symptoms.getAssessments().catch(() => ({ assessments: [] })),
        api.reports.getReports().catch(() => ({ reports: [] })),
        api.diet.getLogs().catch(() => ({ logs: [] })),
        api.fitness.getLogs().catch(() => ({ logs: [] })),
      ]);

      setMeasurements(measRes.measurements);
      setSymptoms(symRes.assessments);
      setReports(repRes.reports);
      setNutritionLogs(nutrRes.logs);
      setWorkoutLogs(workRes.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Consolidate all entries into a unified timeline
  interface TimelineItem {
    id: string;
    type: "measurement" | "symptom" | "report" | "nutrition" | "workout";
    date: string;
    title: string;
    subtitle: string;
    tag?: string;
    badgeColor?: string;
    onDelete?: () => void;
  }

  const timelineItems: TimelineItem[] = [];

  measurements.forEach((m) => {
    timelineItems.push({
      id: m.id,
      type: "measurement",
      date: m.recordedAt,
      title: `BMI ${m.bmi} (${m.bmiCategory})`,
      subtitle: `Weight: ${m.weightKg} kg • Height: ${m.heightCm} cm ${m.systolicBp ? `• BP: ${m.systolicBp}/${m.diastolicBp}` : ""}`,
      tag: "Measurement",
      badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
      onDelete: async () => {
        if (!confirm("Delete measurement?")) return;
        await api.health.deleteMeasurement(m.id);
        setMeasurements((prev) => prev.filter((x) => x.id !== m.id));
      },
    });
  });

  symptoms.forEach((s) => {
    timelineItems.push({
      id: s.id,
      type: "symptom",
      date: s.createdAt,
      title: `Symptom Check: ${s.primarySymptom}`,
      subtitle: `Severity: ${s.severity}/10 • Urgency: ${s.urgencyLevel} • ${s.aiSummary.slice(0, 90)}...`,
      tag: s.urgencyLevel,
      badgeColor: s.urgencyLevel === "Emergency" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-emerald-50 text-emerald-800 border-emerald-200",
      onDelete: async () => {
        if (!confirm("Delete assessment?")) return;
        await api.symptoms.deleteAssessment(s.id);
        setSymptoms((prev) => prev.filter((x) => x.id !== s.id));
      },
    });
  });

  reports.forEach((r) => {
    timelineItems.push({
      id: r.id,
      type: "report",
      date: r.reportDate,
      title: r.reportTitle,
      subtitle: `${r.laboratoryName || "Diagnostic Lab"} • ${r.results?.length || 0} biomarkers extracted`,
      tag: "Lab Report",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      onDelete: async () => {
        if (!confirm("Delete report?")) return;
        await api.reports.deleteReport(r.id);
        setReports((prev) => prev.filter((x) => x.id !== r.id));
      },
    });
  });

  nutritionLogs.forEach((n) => {
    timelineItems.push({
      id: n.id,
      type: "nutrition",
      date: n.loggedAt,
      title: `Meal Log: ${n.foodName}`,
      subtitle: `${n.calories} kcal • P: ${n.proteinG}g, C: ${n.carbsG}g, F: ${n.fatG}g`,
      tag: "Nutrition",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      onDelete: async () => {
        await api.diet.deleteLog(n.id);
        setNutritionLogs((prev) => prev.filter((x) => x.id !== n.id));
      },
    });
  });

  workoutLogs.forEach((w) => {
    timelineItems.push({
      id: w.id,
      type: "workout",
      date: w.completedAt,
      title: `Workout Session: ${w.workoutTitle}`,
      subtitle: `${w.durationMin} mins ${w.caloriesBurned ? `• ~${w.caloriesBurned} kcal` : ""} ${w.perceivedExertion ? `• RPE: ${w.perceivedExertion}/10` : ""}`,
      tag: "Workout",
      badgeColor: "bg-cyan-50 text-cyan-800 border-cyan-200",
    });
  });

  // Sort timeline chronologically descending
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter items
  const filtered = timelineItems.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "measurements") return item.type === "measurement";
    if (activeFilter === "symptoms") return item.type === "symptom";
    if (activeFilter === "reports") return item.type === "report";
    if (activeFilter === "nutrition") return item.type === "nutrition";
    if (activeFilter === "workouts") return item.type === "workout";
    return true;
  });

  // Weight chart series
  const weightTrend = [...measurements].reverse().map((m) => ({
    date: new Date(m.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    weight: m.weightKg,
    bmi: m.bmi,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Unified Health History &amp; Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            A chronological timeline of all your symptoms, lab reports, BMI measurements, nutrition logs, and workout sessions.
          </p>
        </div>

        <button
          onClick={() => exportData()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export All Data (JSON)</span>
        </button>
      </div>

      {/* Analytics Chart */}
      {weightTrend.length > 1 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weight &amp; BMI Trajectory</h3>
              <p className="text-xs text-slate-500">Historical records over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-teal-800">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Weight (kg)
              </span>
              <span className="flex items-center gap-1.5 text-cyan-800">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> BMI
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
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
                <Line type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="bmi" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "All Health Events" },
          { id: "measurements", label: "BMI & Metrics" },
          { id: "symptoms", label: "Symptom Checks" },
          { id: "reports", label: "Lab Reports" },
          { id: "nutrition", label: "Nutrition Logs" },
          { id: "workouts", label: "Workouts" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              activeFilter === tab.id
                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-xs text-slate-400">
            No health records found matching this category filter.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-4 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${item.badgeColor}`}>
                      {item.tag}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600">{item.subtitle}</p>
                </div>

                {item.onDelete && (
                  <button
                    onClick={item.onDelete}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
