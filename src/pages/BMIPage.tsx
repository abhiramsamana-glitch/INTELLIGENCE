import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { HealthMeasurement } from "../types";
import {
  Scale,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  Activity,
  Heart,
  Moon,
  Droplets,
  Footprints,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

export const BMIPage: React.FC = () => {
  const { user } = useAuth();

  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  // Imperial split height (feet and inches)
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");

  // Optional wellness metrics
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [steps, setSteps] = useState("");
  const [waterMl, setWaterMl] = useState("");
  const [notes, setNotes] = useState("");

  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const res = await api.health.getMeasurements();
      setMeasurements(res.measurements);
      if (res.measurements.length > 0) {
        const latest = res.measurements[0];
        if (unit === "metric") {
          setWeight(latest.weightKg.toString());
          setHeight(latest.heightCm.toString());
        } else {
          setWeight(Math.round(latest.weightKg * 2.20462).toString());
          const totalInches = Math.round(latest.heightCm / 2.54);
          setHeightFeet(Math.floor(totalInches / 12).toString());
          setHeightInches((totalInches % 12).toString());
        }
      } else if (user?.heightCm) {
        if (unit === "metric") {
          setHeight(user.heightCm.toString());
        } else {
          const totalInches = Math.round(user.heightCm / 2.54);
          setHeightFeet(Math.floor(totalInches / 12).toString());
          setHeightInches((totalInches % 12).toString());
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, [unit]);

  // Compute live BMI preview
  const computeLiveBMI = () => {
    let wKg = 0;
    let hCm = 0;

    if (unit === "metric") {
      wKg = parseFloat(weight);
      hCm = parseFloat(height);
    } else {
      const wLbs = parseFloat(weight);
      const ft = parseFloat(heightFeet) || 0;
      const inch = parseFloat(heightInches) || 0;
      const totalInches = ft * 12 + inch;
      if (wLbs && totalInches) {
        wKg = wLbs / 2.20462;
        hCm = totalInches * 2.54;
      }
    }

    if (!wKg || !hCm || hCm <= 0 || wKg <= 0) return null;
    const hM = hCm / 100;
    const bmiVal = parseFloat((wKg / (hM * hM)).toFixed(1));

    let category = "Normal weight";
    let color = "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (bmiVal < 18.5) {
      category = "Underweight";
      color = "text-blue-700 bg-blue-50 border-blue-200";
    } else if (bmiVal < 25) {
      category = "Normal weight";
      color = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (bmiVal < 30) {
      category = "Overweight";
      color = "text-amber-700 bg-amber-50 border-amber-200";
    } else if (bmiVal < 35) {
      category = "Obese Class I";
      color = "text-orange-700 bg-orange-50 border-orange-200";
    } else if (bmiVal < 40) {
      category = "Obese Class II";
      color = "text-rose-700 bg-rose-50 border-rose-200";
    } else {
      category = "Obese Class III";
      color = "text-red-800 bg-red-100 border-red-300";
    }

    // Healthy weight range for this height (BMI 18.5 - 24.9)
    const minHealthyKg = parseFloat((18.5 * hM * hM).toFixed(1));
    const maxHealthyKg = parseFloat((24.9 * hM * hM).toFixed(1));

    return {
      bmi: bmiVal,
      category,
      color,
      wKg: parseFloat(wKg.toFixed(1)),
      hCm: parseFloat(hCm.toFixed(1)),
      minHealthyKg,
      maxHealthyKg,
    };
  };

  const preview = computeLiveBMI();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) {
      setError("Please provide both valid weight and height inputs.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const res = await api.health.addMeasurement({
        weightKg: preview.wKg,
        heightCm: preview.hCm,
        systolicBp: systolic ? parseInt(systolic) : undefined,
        diastolicBp: diastolic ? parseInt(diastolic) : undefined,
        restingHeartRate: restingHr ? parseInt(restingHr) : undefined,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        dailySteps: steps ? parseInt(steps) : undefined,
        waterMl: waterMl ? parseInt(waterMl) : undefined,
        notes: notes || undefined,
      });

      setSuccessMsg("Health measurement successfully recorded!");
      setMeasurements((prev) => [res.measurement, ...prev]);
      setNotes("");
    } catch (err: any) {
      setError(err.message || "Failed to save measurement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this measurement record?")) return;
    try {
      await api.health.deleteMeasurement(id);
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Prepare chart series (oldest to newest)
  const chartSeries = [...measurements]
    .reverse()
    .map((m) => ({
      date: new Date(m.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      bmi: m.bmi,
      weight: unit === "metric" ? m.weightKg : Math.round(m.weightKg * 2.20462),
    }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">BMI &amp; Body Health Metrics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Screen Body Mass Index (BMI), track physiological measurements, and monitor longitudinal body composition trends.
          </p>
        </div>

        {/* Unit switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start md:self-auto">
          <button
            onClick={() => setUnit("metric")}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              unit === "metric" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Metric (kg, cm)
          </button>
          <button
            onClick={() => setUnit("imperial")}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              unit === "imperial" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Imperial (lbs, ft/in)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Calculator & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>Log New Measurement</span>
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Weight and Height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Body Weight ({unit === "metric" ? "kg" : "lbs"}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={unit === "metric" ? "e.g. 72.5" : "e.g. 160"}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {unit === "metric" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Feet *</label>
                    <input
                      type="number"
                      required
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="5"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Inches *</label>
                    <input
                      type="number"
                      required
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder="9"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Optional Vitals Header */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Optional Vitals &amp; Daily Metrics
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">BP Systolic</label>
                <input
                  type="number"
                  placeholder="120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">BP Diastolic</label>
                <input
                  type="number"
                  placeholder="80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Resting HR (bpm)</label>
                <input
                  type="number"
                  placeholder="65"
                  value={restingHr}
                  onChange={(e) => setRestingHr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sleep (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="7.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Daily Steps</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Water Intake (ml)</label>
                <input
                  type="number"
                  placeholder="2500"
                  value={waterMl}
                  onChange={(e) => setWaterMl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Personal Notes</label>
              <input
                type="text"
                placeholder="e.g. Morning fasting weigh-in, post light cardio"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? "Saving to Private Record..." : "Save Measurement & Log Trend"}</span>
            </button>
          </form>
        </div>

        {/* Right: Live Clinical Category & Calculation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Clinical Assessment Result
            </h3>

            {preview ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-4xl font-extrabold text-slate-950 font-mono tracking-tight">
                    {preview.bmi}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${preview.color}`}>
                      {preview.category}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Calculated for {preview.wKg} kg and {preview.hCm} cm
                  </p>
                </div>

                {/* Healthy target range */}
                <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-2xl text-xs text-teal-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    Healthy Weight Interval (BMI 18.5 – 24.9)
                  </p>
                  <p className="text-[11px] text-teal-900 leading-relaxed">
                    For your height of {preview.hCm} cm, the standard reference weight range is{" "}
                    <strong>
                      {unit === "metric"
                        ? `${preview.minHealthyKg} kg – ${preview.maxHealthyKg} kg`
                        : `${Math.round(preview.minHealthyKg * 2.20462)} lbs – ${Math.round(preview.maxHealthyKg * 2.20462)} lbs`}
                    </strong>
                    .
                  </p>
                </div>

                {/* Standard Adult Categories Reference */}
                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Adult Conventional Categories:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-100">
                      Underweight: &lt; 18.5
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100">
                      Normal: 18.5 – 24.9
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-100">
                      Overweight: 25.0 – 29.9
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-900 border border-rose-100">
                      Obesity: &ge; 30.0
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                Enter your weight and height to view real-time BMI calculations.
              </div>
            )}
          </div>

          {/* Clinical Limitation Disclosure */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-950 text-xs space-y-1.5 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              Screening Limitations of BMI
            </div>
            <p className="text-[11px] text-amber-900/90">
              BMI is a statistical screening metric, not a diagnostic test. It does not differentiate between skeletal muscle mass and adipose tissue, and does not evaluate visceral fat. Limitations apply to athletes with high lean mass, pregnancy, growing children, and older adults with bone density loss.
            </p>
          </div>
        </div>
      </div>

      {/* Historical BMI Trends Chart */}
      {chartSeries.length > 1 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Longitudinal BMI Trend</h3>
              <p className="text-xs text-slate-500">Historical records over time</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {measurements.length} Total Logs
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartSeries} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine y={18.5} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: "Underweight threshold (18.5)", fontSize: 10, fill: "#38bdf8" }} />
                <ReferenceLine y={25.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Overweight threshold (25.0)", fontSize: 10, fill: "#f59e0b" }} />
                <Line type="monotone" dataKey="bmi" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: "#0d9488" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Past Measurements Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Measurement History Log</h3>

        {measurements.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No past measurements recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Recorded Date</th>
                  <th className="py-3 px-4 font-bold">Weight</th>
                  <th className="py-3 px-4 font-bold">Height</th>
                  <th className="py-3 px-4 font-bold">BMI</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">BP / HR</th>
                  <th className="py-3 px-4 font-bold">Sleep &amp; Steps</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {new Date(m.recordedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {unit === "metric" ? `${m.weightKg} kg` : `${Math.round(m.weightKg * 2.20462)} lbs`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {unit === "metric" ? `${m.heightCm} cm` : `${Math.round(m.heightCm / 2.54)} in`}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">{m.bmi}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {m.bmiCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {m.systolicBp && m.diastolicBp ? `${m.systolicBp}/${m.diastolicBp} mmHg` : "—"}
                      {m.restingHeartRate ? ` • ${m.restingHeartRate} bpm` : ""}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {m.sleepHours ? `${m.sleepHours}h sleep` : "—"}
                      {m.dailySteps ? ` • ${m.dailySteps} steps` : ""}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
