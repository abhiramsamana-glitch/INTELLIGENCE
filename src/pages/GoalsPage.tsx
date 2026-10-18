import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { WellnessGoal } from "../types";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Droplets,
  Scale,
  Dumbbell,
  Moon,
  Apple,
} from "lucide-react";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

export const GoalsPage: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<WellnessGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // New goal form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<"weight" | "water" | "activity" | "sleep" | "nutrition">("activity");
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("4");
  const [unit, setUnit] = useState("sessions/week");

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.goals.getGoals();
      setGoals(res.goals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await api.goals.addGoal({
        category,
        title,
        targetValue: parseFloat(targetValue) || 10,
        currentValue: 0,
        unit,
      });
      setGoals((prev) => [res.goal, ...prev]);
      setShowAddModal(false);
      setTitle("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateProgress = async (id: string, currentValue: number, targetValue: number) => {
    const isCompleted = currentValue >= targetValue;
    try {
      const res = await api.goals.updateGoal(id, { currentValue, isCompleted });
      setGoals((prev) => prev.map((g) => (g.id === id ? res.goal : g)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Delete this wellness goal?")) return;
    try {
      await api.goals.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "water":
        return <Droplets className="w-4 h-4 text-cyan-600" />;
      case "weight":
        return <Scale className="w-4 h-4 text-teal-600" />;
      case "activity":
        return <Dumbbell className="w-4 h-4 text-emerald-600" />;
      case "sleep":
        return <Moon className="w-4 h-4 text-indigo-600" />;
      default:
        return <Apple className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Personal Wellness Goals</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Set and track actionable daily and weekly targets for hydration, body composition, sleep regularity, and workout frequency.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((g) => {
          const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
          return (
            <div
              key={g.id}
              className={`bg-white rounded-3xl p-6 border transition-all ${
                g.isCompleted ? "border-emerald-300 bg-emerald-50/20" : "border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    {getCategoryIcon(g.category)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {g.category}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteGoal(g.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-2">{g.title}</h4>

              {/* Progress bar */}
              <div className="space-y-1.5 my-3">
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-slate-800">
                    {g.currentValue} / {g.targetValue} {g.unit}
                  </span>
                  <span className="text-teal-700 font-bold">{percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      g.isCompleted ? "bg-emerald-500" : "bg-teal-600"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Quick check-in increment buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleUpdateProgress(g.id, Math.max(0, g.currentValue - 1), g.targetValue)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  -1
                </button>
                <button
                  onClick={() => handleUpdateProgress(g.id, g.currentValue + 1, g.targetValue)}
                  className="flex-1 py-1 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg transition-colors text-center"
                >
                  +1 Check-in
                </button>
                {g.isCompleted && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Done
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create New Wellness Target</h3>

            <form onSubmit={handleAddGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="activity">Physical Activity / Workouts</option>
                  <option value="water">Hydration &amp; Water Volume</option>
                  <option value="weight">Body Weight / BMI Management</option>
                  <option value="sleep">Sleep &amp; Rest</option>
                  <option value="nutrition">Dietary Quality &amp; Protein</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete 4 Strength Workouts Weekly"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Label</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="sessions, ml, kg, hours"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};
