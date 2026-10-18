import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { DietPreferences, Meal, NutritionLog, WaterLog } from "../types";
import {
  Utensils,
  Droplets,
  Flame,
  Plus,
  Trash2,
  Sparkles,
  Check,
  AlertCircle,
  Apple,
  Save,
  Clock,
  ChevronRight,
  RefreshCw,
  Heart,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

export const DietPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split("T")[0];

  // Preferences
  const [preferences, setPreferences] = useState<DietPreferences>({
    userId: user?.id || "",
    dietaryPattern: "mediterranean",
    allergies: ["Peanuts"],
    dislikedFoods: [],
    dailyCalorieTarget: 2000,
    dailyWaterTargetMl: 2500,
    dailyProteinTargetG: 110,
    dailyCarbsTargetG: 220,
    dailyFatTargetG: 65,
  });

  // State
  const [meals, setMeals] = useState<Meal[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{
    meals: Meal[];
    dailyTotalCalories: number;
    dailyTotalProtein: number;
    dailyTotalCarbs: number;
    dailyTotalFat: number;
    nutritionAdvice: string;
  } | null>(null);

  // Quick Food Logger modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMealType, setLogMealType] = useState("lunch");
  const [logFoodName, setLogFoodName] = useState("");
  const [logCalories, setLogCalories] = useState("450");
  const [logProtein, setLogProtein] = useState("25");
  const [logCarbs, setLogCarbs] = useState("40");
  const [logFat, setLogFat] = useState("12");

  // Custom allergy addition
  const [newAllergy, setNewAllergy] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prefRes, mealRes, logRes, waterRes] = await Promise.all([
        api.diet.getPreferences().catch(() => ({ preferences })),
        api.diet.getMeals().catch(() => ({ meals: [] })),
        api.diet.getLogs(todayStr).catch(() => ({ logs: [] })),
        api.diet.getWater(todayStr).catch(() => ({ logs: [] })),
      ]);

      if (prefRes.preferences) setPreferences(prefRes.preferences);
      setMeals(mealRes.meals);
      setNutritionLogs(logRes.logs);
      setWaterLogs(waterRes.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dietaryPatterns = [
    { id: "omnivorous", name: "Balanced Omnivorous" },
    { id: "mediterranean", name: "Mediterranean (Heart-Healthy)" },
    { id: "vegetarian", name: "Vegetarian (Plant-Forward)" },
    { id: "vegan", name: "Vegan (Strict Plant-Based)" },
    { id: "pescatarian", name: "Pescatarian" },
    { id: "low-carb", name: "Low-Carb / Glycemic" },
  ];

  const commonAllergies = ["Peanuts", "Tree Nuts", "Dairy", "Gluten / Wheat", "Shellfish", "Soy", "Eggs"];

  const handleToggleAllergy = async (allergy: string) => {
    let updated: string[];
    if (preferences.allergies.includes(allergy)) {
      updated = preferences.allergies.filter((a) => a !== allergy);
    } else {
      updated = [...preferences.allergies, allergy];
    }
    const newPrefs = { ...preferences, allergies: updated };
    setPreferences(newPrefs);
    await api.diet.updatePreferences(newPrefs);
  };

  const handleAddCustomAllergy = async () => {
    if (newAllergy.trim() && !preferences.allergies.includes(newAllergy.trim())) {
      const updated = [...preferences.allergies, newAllergy.trim()];
      const newPrefs = { ...preferences, allergies: updated };
      setPreferences(newPrefs);
      setNewAllergy("");
      await api.diet.updatePreferences(newPrefs);
    }
  };

  const handleUpdatePattern = async (pattern: string) => {
    const newPrefs = { ...preferences, dietaryPattern: pattern };
    setPreferences(newPrefs);
    await api.diet.updatePreferences(newPrefs);
  };

  const handleGenerateAIPlan = async () => {
    setGenerating(true);
    try {
      const plan = await api.diet.generatePlan({
        dietaryPattern: preferences.dietaryPattern,
        allergies: preferences.allergies,
        calorieTarget: preferences.dailyCalorieTarget,
        goal: "balanced_wellness",
      });
      setGeneratedPlan(plan);
    } catch (err: any) {
      alert(err.message || "Plan generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveMealToVault = async (m: Meal) => {
    try {
      const res = await api.diet.addMeal(m);
      setMeals((prev) => [res.meal, ...prev]);
      alert(`"${m.title}" saved to your recipe collection!`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!confirm("Remove this meal from your collection?")) return;
    try {
      await api.diet.deleteMeal(id);
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleAddNutritionLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logFoodName.trim()) return;

    try {
      const res = await api.diet.addLog({
        mealType: logMealType,
        foodName: logFoodName,
        calories: parseInt(logCalories) || 0,
        proteinG: parseFloat(logProtein) || 0,
        carbsG: parseFloat(logCarbs) || 0,
        fatG: parseFloat(logFat) || 0,
      });
      setNutritionLogs((prev) => [res.log, ...prev]);
      setShowLogModal(false);
      setLogFoodName("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await api.diet.deleteLog(id);
      setNutritionLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleAddWater = async (amount: number) => {
    try {
      const res = await api.diet.addWater(amount);
      setWaterLogs((prev) => [res.log, ...prev]);
    } catch (e: any) {
      console.error(e);
    }
  };

  // Calculations for today
  const totalWater = waterLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
  const targetWater = preferences.dailyWaterTargetMl || 2500;
  const totalCal = nutritionLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = nutritionLogs.reduce((acc, curr) => acc + (curr.proteinG || 0), 0);
  const totalCarbs = nutritionLogs.reduce((acc, curr) => acc + (curr.carbsG || 0), 0);
  const totalFat = nutritionLogs.reduce((acc, curr) => acc + (curr.fatG || 0), 0);

  // Macro pie data
  const macroData = [
    { name: "Protein (g)", value: totalProtein || 1, color: "#0d9488" },
    { name: "Carbs (g)", value: totalCarbs || 1, color: "#38bdf8" },
    { name: "Fat (g)", value: totalFat || 1, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Utensils className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Personalized Diet &amp; Nutrition</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Custom meal planning respecting allergy restrictions and caloric goals with transparent macronutrient breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Log Food Item</span>
          </button>
        </div>
      </div>

      {/* Daily Progress Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Calories</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCal}</span>
            <span className="text-xs text-slate-500">/ {preferences.dailyCalorieTarget} kcal</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((totalCal / preferences.dailyCalorieTarget) * 100))}%` }}
            />
          </div>
        </div>

        {/* Protein */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Protein Intake</span>
          <div className="mt-3 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-800">{totalProtein.toFixed(0)}</span>
            <span className="text-xs text-slate-500">/ {preferences.dailyProteinTargetG} g</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Essential for cellular repair</p>
        </div>

        {/* Carbohydrates */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Carbohydrates</span>
          <div className="mt-3 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-800">{totalCarbs.toFixed(0)}</span>
            <span className="text-xs text-slate-500">/ {preferences.dailyCarbsTargetG} g</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Complex glycemic energy</p>
        </div>

        {/* Hydration Tracker */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hydration Volume</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-800">{totalWater}</span>
            <span className="text-xs text-slate-500">/ {targetWater} ml</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <button
              onClick={() => handleAddWater(250)}
              className="flex-1 py-1 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-semibold transition-colors text-center"
            >
              +250ml
            </button>
            <button
              onClick={() => handleAddWater(500)}
              className="flex-1 py-1 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-semibold transition-colors text-center"
            >
              +500ml
            </button>
          </div>
        </div>
      </div>

      {/* Dietary Preferences & Allergy Exclusions Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Dietary Pattern &amp; Allergy Guardrails</h3>
          <p className="text-xs text-slate-500">All generated meal suggestions strictly respect these parameters.</p>
        </div>

        <div className="space-y-3">
          {/* Dietary Pattern Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Pattern</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {dietaryPatterns.map((p) => {
                const isSelected = preferences.dietaryPattern === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleUpdatePattern(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs font-semibold ${
                      isSelected
                        ? "bg-teal-50 border-teal-500 text-teal-900 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergy Exclusion Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Strict Food Allergies &amp; Avoidances
            </label>
            <div className="flex flex-wrap gap-2">
              {commonAllergies.map((allergy) => {
                const hasAllergy = preferences.allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    onClick={() => handleToggleAllergy(allergy)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      hasAllergy
                        ? "bg-rose-50 border-rose-300 text-rose-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {hasAllergy && <Check className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{allergy}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom allergy input */}
            <div className="flex gap-2 max-w-sm mt-2">
              <input
                type="text"
                placeholder="Add other allergy (e.g. Sesame)"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomAllergy())}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddCustomAllergy}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateAIPlan}
              disabled={generating}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Formulating Balanced Meals...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Meal Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated AI Meal Plan Section */}
      {generatedPlan && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-teal-200 shadow-md shadow-teal-900/5 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Tailored Meal Blueprint
              </div>
              <h3 className="text-lg font-bold text-slate-900">Custom 1-Day Meal Plan</h3>
              <p className="text-xs text-slate-500">{generatedPlan.nutritionAdvice}</p>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="font-bold text-slate-900 text-base">{generatedPlan.dailyTotalCalories} kcal</span>
              <p className="text-[11px] text-slate-500">
                P: {generatedPlan.dailyTotalProtein}g • C: {generatedPlan.dailyTotalCarbs}g • F: {generatedPlan.dailyTotalFat}g
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedPlan.meals.map((meal, idx) => (
              <div key={idx} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-teal-800">
                    {meal.mealType}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    ~{meal.estimatedCalories} kcal
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{meal.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{meal.description}</p>

                {meal.ingredients?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700">Ingredients:</span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                      {meal.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meal.instructions?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700">Instructions:</span>
                    <ol className="text-xs text-slate-600 list-decimal list-inside mt-1 space-y-0.5">
                      {meal.instructions.map((ins, i) => (
                        <li key={i}>{ins}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <span>P: {meal.proteinG}g • C: {meal.carbsG}g • F: {meal.fatG}g</span>
                  <button
                    onClick={() => handleSaveMealToVault(meal)}
                    className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Recipes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Logged Foods & Saved Recipes Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Food Logs */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Food Intake</h3>
              <p className="text-xs text-slate-500">Recorded food items for {todayStr}</p>
            </div>
            <button
              onClick={() => setShowLogModal(true)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          {nutritionLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No food items logged today yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {nutritionLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{log.foodName}</span>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {log.mealType} • {log.calories} kcal (P: {log.proteinG}g, C: {log.carbsG}g, F: {log.fatG}g)
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Recipes Vault */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Saved Recipes Vault</h3>
          <p className="text-xs text-slate-500 mb-4">Your favorite meals &amp; snacks</p>

          {meals.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recipes saved to vault yet.</p>
          ) : (
            <div className="space-y-3">
              {meals.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                      {m.mealType}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
                    <p className="text-[11px] text-slate-500">{m.estimatedCalories} kcal • P: {m.proteinG}g</p>
                  </div>
                  <button
                    onClick={() => handleDeleteMeal(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Food Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Log Food Item</h3>

            <form onSubmit={handleAddNutritionLog} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meal Type</label>
                <select
                  value={logMealType}
                  onChange={(e) => setLogMealType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Food Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grilled Chicken Salad"
                  value={logFoodName}
                  onChange={(e) => setLogFoodName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={logCalories}
                    onChange={(e) => setLogCalories(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={logProtein}
                    onChange={(e) => setLogProtein(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={logCarbs}
                    onChange={(e) => setLogCarbs(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={logFat}
                    onChange={(e) => setLogFat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Entry
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
