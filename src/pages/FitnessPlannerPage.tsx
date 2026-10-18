import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { FitnessPreferences, Workout, WorkoutLog, Exercise } from "../types";
import {
  Dumbbell,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Activity,
  Flame,
  Info,
  RefreshCw,
  Heart,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

export const FitnessPlannerPage: React.FC = () => {
  const { user } = useAuth();

  const [preferences, setPreferences] = useState<FitnessPreferences>({
    userId: user?.id || "",
    experienceLevel: "beginner",
    primaryGoal: "general_fitness",
    availableEquipment: ["bodyweight", "dumbbells"],
    weeklyFrequencyDays: 3,
    physicalLimitations: "",
  });

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Active workout execution mode
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Record<number, boolean>>({});

  // Log completed workout modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTitle, setLogTitle] = useState("");
  const [logDuration, setLogDuration] = useState("35");
  const [logCalories, setLogCalories] = useState("280");
  const [logRpe, setLogRpe] = useState(7);
  const [logNotes, setLogNotes] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prefRes, workRes, logRes] = await Promise.all([
        api.fitness.getPreferences().catch(() => ({ preferences })),
        api.fitness.getWorkouts().catch(() => ({ workouts: [] })),
        api.fitness.getLogs().catch(() => ({ logs: [] })),
      ]);

      if (prefRes.preferences) setPreferences(prefRes.preferences);
      setWorkouts(workRes.workouts);
      setLogs(logRes.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const goals = [
    { id: "general_fitness", label: "General Health & Longevity" },
    { id: "weight_loss", label: "Fat Loss & Metabolic Health" },
    { id: "muscle_gain", label: "Hypertrophy & Muscle Tone" },
    { id: "endurance", label: "Cardiorespiratory Endurance" },
    { id: "mobility", label: "Joint Mobility & Posture" },
  ];

  const levels = [
    { id: "beginner", label: "Beginner (New / Returning)" },
    { id: "intermediate", label: "Intermediate (Regular activity)" },
    { id: "advanced", label: "Advanced (Experienced athlete)" },
  ];

  const equipmentOptions = [
    { id: "bodyweight", label: "Bodyweight Only" },
    { id: "dumbbells", label: "Dumbbells" },
    { id: "resistance_bands", label: "Resistance Bands" },
    { id: "pull_up_bar", label: "Pull-up Bar" },
    { id: "kettlebells", label: "Kettlebells" },
    { id: "full_gym", label: "Full Commercial Gym" },
  ];

  const handleToggleEquipment = async (id: string) => {
    let updated: string[];
    if (preferences.availableEquipment.includes(id)) {
      updated = preferences.availableEquipment.filter((e) => e !== id);
    } else {
      updated = [...preferences.availableEquipment, id];
    }
    const newPrefs = { ...preferences, availableEquipment: updated };
    setPreferences(newPrefs);
    await api.fitness.updatePreferences(newPrefs);
  };

  const handleUpdateLevel = async (level: any) => {
    const newPrefs = { ...preferences, experienceLevel: level };
    setPreferences(newPrefs);
    await api.fitness.updatePreferences(newPrefs);
  };

  const handleUpdateGoal = async (goal: any) => {
    const newPrefs = { ...preferences, primaryGoal: goal };
    setPreferences(newPrefs);
    await api.fitness.updatePreferences(newPrefs);
  };

  const handleGenerateAIWorkout = async () => {
    setGenerating(true);
    try {
      const plan = await api.fitness.generatePlan({
        level: preferences.experienceLevel,
        goal: preferences.primaryGoal,
        equipment: preferences.availableEquipment,
        targetMinutes: 35,
        limitations: preferences.physicalLimitations,
      });

      const res = await api.fitness.addWorkout({
        title: plan.title,
        difficulty: plan.difficulty,
        targetMuscleGroups: plan.targetMuscleGroups,
        estimatedDurationMin: plan.estimatedDurationMin,
        exercises: plan.exercises,
        warmupTips: plan.warmupTips,
        cooldownTips: plan.cooldownTips,
      });

      setWorkouts((prev) => [res.workout, ...prev]);
      setActiveWorkout(res.workout);
      setCompletedExercises({});
    } catch (err: any) {
      alert(err.message || "Failed to generate workout.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Delete this saved workout routine?")) return;
    try {
      await api.fitness.deleteWorkout(id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      if (activeWorkout?.id === id) setActiveWorkout(null);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.fitness.addLog({
        workoutTitle: logTitle || activeWorkout?.title || "Workout Session",
        durationMin: parseInt(logDuration) || 30,
        caloriesBurned: parseInt(logCalories) || 250,
        perceivedExertion: logRpe,
        notes: logNotes || undefined,
        workoutId: activeWorkout?.id,
      });
      setLogs((prev) => [res.log, ...prev]);
      setShowLogModal(false);
      setLogNotes("");
      alert("Workout completion recorded to your health history!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Fitness &amp; Workout Planner</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Custom movement programs tailored to your fitness level, joint considerations, and available gear with lower-impact modifications.
          </p>
        </div>

        <button
          onClick={() => {
            setLogTitle(activeWorkout?.title || "Full Body Workout");
            setShowLogModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start md:self-auto"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Record Completed Session</span>
        </button>
      </div>

      {/* Fitness Preferences Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Your Training Profile</h3>
          <p className="text-xs text-slate-500">
            Tell HealthMate about your experience level and equipment to generate safe, effective routines.
          </p>
        </div>

        <div className="space-y-4">
          {/* Experience level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Experience Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {levels.map((lvl) => {
                const isSelected = preferences.experienceLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => handleUpdateLevel(lvl.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Fitness Goal</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {goals.map((g) => {
                const isSelected = preferences.primaryGoal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => handleUpdateGoal(g.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Available Equipment</label>
            <div className="flex flex-wrap gap-2">
              {equipmentOptions.map((eq) => {
                const has = preferences.availableEquipment.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    onClick={() => handleToggleEquipment(eq.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      has
                        ? "bg-teal-50 border-teal-500 text-teal-900"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {has ? "✓ " : "+ "}
                    {eq.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Limitations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Limitations or Joint Cautions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Mild lower back sensitivity, avoid high impact jumping"
              value={preferences.physicalLimitations || ""}
              onChange={(e) => {
                const newP = { ...preferences, physicalLimitations: e.target.value };
                setPreferences(newP);
              }}
              onBlur={() => api.fitness.updatePreferences(preferences)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateAIWorkout}
              disabled={generating}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Structuring Safe Exercise Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Workout Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Workout Tracker View */}
      {activeWorkout && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-300 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
                <Activity className="w-3.5 h-3.5" /> Active Session
              </div>
              <h3 className="text-xl font-bold text-slate-900">{activeWorkout.title}</h3>
              <p className="text-xs text-slate-500">
                Estimated Duration: ~{activeWorkout.estimatedDurationMin} mins • Difficulty: {activeWorkout.difficulty}
              </p>
            </div>

            <button
              onClick={() => {
                setLogTitle(activeWorkout.title);
                setShowLogModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete &amp; Log Session</span>
            </button>
          </div>

          {/* Warm-up */}
          {activeWorkout.warmupTips && (
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-950">
              <span className="font-bold">Warm-Up Preparation:</span> {activeWorkout.warmupTips}
            </div>
          )}

          {/* Exercise list with interactive checkboxes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Exercises ({Object.values(completedExercises).filter(Boolean).length} / {activeWorkout.exercises.length} completed)
            </h4>

            {activeWorkout.exercises.map((ex, idx) => {
              const isDone = !!completedExercises[idx];
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDone
                      ? "bg-emerald-50/50 border-emerald-200 opacity-80"
                      : "bg-slate-50 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() =>
                          setCompletedExercises((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white border-slate-300 text-transparent hover:border-emerald-500"
                        }`}
                      >
                        ✓
                      </button>
                      <div>
                        <h5 className={`text-sm font-bold ${isDone ? "line-through text-slate-500" : "text-slate-900"}`}>
                          {idx + 1}. {ex.name}
                        </h5>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ex.instructions}</p>
                        {ex.modification && (
                          <p className="text-[11px] text-teal-800 bg-teal-50/80 border border-teal-100 p-1.5 rounded-lg mt-2 inline-block">
                            <strong>Modification:</strong> {ex.modification}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono shrink-0">
                      <span className="font-bold text-slate-900">
                        {ex.sets} sets {ex.reps ? `× ${ex.reps}` : ""}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Rest: {ex.restSec}s</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cool-down */}
          {activeWorkout.cooldownTips && (
            <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200 text-xs text-teal-950">
              <span className="font-bold">Cool-Down &amp; Mobility:</span> {activeWorkout.cooldownTips}
            </div>
          )}
        </div>
      )}

      {/* Saved Routines and Past Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Saved Workouts */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Saved Workout Plans</h3>
          <p className="text-xs text-slate-500 mb-4">Click to load and launch routine</p>

          {workouts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No workout routines created yet.</p>
          ) : (
            <div className="space-y-3">
              {workouts.map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    setActiveWorkout(w);
                    setCompletedExercises({});
                  }}
                  className="p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {w.difficulty}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {w.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {w.exercises?.length || 0} exercises • ~{w.estimatedDurationMin} mins
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkout(w.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workout Activity History */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Completed Activity History</h3>
          <p className="text-xs text-slate-500 mb-4">Verified completed fitness sessions</p>

          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No workouts completed yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{log.workoutTitle}</span>
                    <p className="text-[11px] text-slate-500">
                      {new Date(log.completedAt).toLocaleDateString()} • {log.durationMin} mins
                      {log.caloriesBurned ? ` • ~${log.caloriesBurned} kcal` : ""}
                      {log.perceivedExertion ? ` • RPE: ${log.perceivedExertion}/10` : ""}
                    </p>
                    {log.notes && <p className="text-[11px] text-slate-600 italic mt-0.5">{log.notes}</p>}
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg font-bold text-[10px]">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Workout Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Record Completed Workout</h3>

            <form onSubmit={handleLogWorkout} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workout Title</label>
                <input
                  type="text"
                  required
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={logDuration}
                    onChange={(e) => setLogDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Calories Burned</label>
                  <input
                    type="number"
                    value={logCalories}
                    onChange={(e) => setLogCalories(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rate of Perceived Exertion (RPE: 1 - 10): {logRpe}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={logRpe}
                  onChange={(e) => setLogRpe(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Felt strong on bodyweight squats, steady breathing"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Log
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
