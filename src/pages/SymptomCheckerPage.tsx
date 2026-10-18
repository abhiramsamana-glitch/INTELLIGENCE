import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { SymptomAssessment } from "../types";
import {
  Stethoscope,
  AlertTriangle,
  ShieldAlert,
  Send,
  Save,
  Trash2,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Activity,
  History,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

interface SymptomCheckerPageProps {
  onOpenEmergency: () => void;
}

export const SymptomCheckerPage: React.FC<SymptomCheckerPageProps> = ({ onOpenEmergency }) => {
  const { user } = useAuth();

  // Step 1: Emergency screener acknowledged
  const [passedEmergencyScreener, setPassedEmergencyScreener] = useState(false);

  // Form inputs
  const [primarySymptom, setPrimarySymptom] = useState("");
  const [details, setDetails] = useState("");
  const [duration, setDuration] = useState("1-2 days");
  const [severity, setSeverity] = useState(5);
  const [associatedSymptoms, setAssociatedSymptoms] = useState<string[]>([]);
  const [newAssociated, setNewAssociated] = useState("");

  // Loading & Assessment Results
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<{
    urgencyLevel: "Emergency" | "Urgent Care" | "Routine Care" | "Self-Care";
    emergencyWarning: boolean;
    summary: string;
    potentialCauses: string[];
    questionsForDoctor: string[];
    selfCareTips: string[];
    disclaimer: string;
  } | null>(null);

  // Consent to save to private record
  const [consentToSave, setConsentToSave] = useState(true);
  const [savingRecord, setSavingRecord] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // History Drawer
  const [pastAssessments, setPastAssessments] = useState<SymptomAssessment[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.symptoms.getAssessments();
      setPastAssessments(res.assessments);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const commonSymptomChips = [
    "Headache & Temple Pressure",
    "Persistent Dry Cough",
    "Sore Throat & Swallowing Pain",
    "Lower Back Stiffness",
    "Digestive Upset & Bloating",
    "Fatigue & Muscle Aches",
    "Mild Joint Inflammation",
  ];

  const handleAddAssociated = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (newAssociated.trim() && !associatedSymptoms.includes(newAssociated.trim())) {
      setAssociatedSymptoms([...associatedSymptoms, newAssociated.trim()]);
      setNewAssociated("");
    }
  };

  const handleRemoveAssociated = (sym: string) => {
    setAssociatedSymptoms(associatedSymptoms.filter((s) => s !== sym));
  };

  const handleAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primarySymptom.trim()) return;

    setLoading(true);
    setAssessment(null);
    setSavedSuccess(false);

    try {
      const combinedDetails = `${details}. Associated signs: ${associatedSymptoms.join(", ") || "None specified"}`;
      const res = await api.symptoms.assess({
        primarySymptom,
        details: combinedDetails,
        duration,
        severity,
      });

      setAssessment(res);

      // Auto-save if consent is given
      if (consentToSave) {
        try {
          await api.symptoms.saveAssessment({
            primarySymptom,
            symptomDetails: combinedDetails,
            duration,
            severity,
            urgencyLevel: res.urgencyLevel,
            aiSummary: res.summary,
            aiPotentialCauses: res.potentialCauses,
            aiQuestionsForDoctor: res.questionsForDoctor,
            aiSelfCareTips: res.selfCareTips,
            emergencyWarningShown: res.emergencyWarning,
          });
          setSavedSuccess(true);
          fetchHistory();
        } catch (saveErr) {
          console.warn("Could not auto-save assessment:", saveErr);
        }
      }
    } catch (err: any) {
      alert(err.message || "Assessment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm("Delete this previous assessment from your records?")) return;
    try {
      await api.symptoms.deleteAssessment(id);
      setPastAssessments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">AI Symptom Checker &amp; Triage</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Conversational symptom assessment powered by clinical triage principles. Distinguishes emergency red flags from routine self-care.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <History className="w-4 h-4" />
            <span>Past Assessments ({pastAssessments.length})</span>
          </button>
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Emergency Guide</span>
          </button>
        </div>
      </div>

      {/* Emergency Pre-screener Gate */}
      {!passedEmergencyScreener ? (
        <div className="bg-rose-50/80 border-2 border-rose-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-rose-900">
            <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Important Emergency Screening Before We Begin</h3>
              <p className="text-xs text-rose-800">
                Are you experiencing any of the following life-threatening symptoms right now?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-rose-950 font-medium pt-2">
            <div className="p-3 bg-white/80 rounded-xl border border-rose-200">
              • Sudden crushing chest pain, pressure, or tightness radiating to arm or jaw
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-rose-200">
              • Sudden severe shortness of breath or inability to speak in sentences
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-rose-200">
              • Sudden drooping of one side of face or sudden weakness/numbness in arm
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-rose-200">
              • Severe sudden onset thunderclap headache or loss of consciousness
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-rose-200">
            <button
              onClick={onOpenEmergency}
              className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>YES — Call Emergency Services Now</span>
            </button>
            <button
              onClick={() => setPassedEmergencyScreener(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-rose-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              NO — I am not experiencing these emergency signs (Continue)
            </button>
          </div>
        </div>
      ) : (
        /* Main Symptom Assessment Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Assessment Input Column */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900">Describe What You Are Feeling</h3>

            <form onSubmit={handleAssess} className="space-y-4">
              {/* Primary Symptom */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Symptom or Chief Complaint *
                </label>
                <input
                  type="text"
                  required
                  value={primarySymptom}
                  onChange={(e) => setPrimarySymptom(e.target.value)}
                  placeholder="e.g. Throbbing frontal headache, Dull abdominal cramps"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />

                {/* Common symptom suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {commonSymptomChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrimarySymptom(chip)}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Slider */}
              <div>
                <div className="flex items-center justify-between mb-1 text-xs font-bold text-slate-700">
                  <span>Severity Scale: {severity} / 10</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {severity <= 3 ? "Mild" : severity <= 6 ? "Moderate" : severity <= 8 ? "Severe" : "Very Severe"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>1 (Mild nuisance)</span>
                  <span>5 (Noticeable discomfort)</span>
                  <span>10 (Debilitating)</span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">How long has this lasted?</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Just started today (under 6 hours)">Just started today (&lt; 6 hours)</option>
                  <option value="1-2 days">1 to 2 days</option>
                  <option value="3-7 days">3 to 7 days</option>
                  <option value="1-2 weeks">1 to 2 weeks</option>
                  <option value="More than a month (chronic)">More than a month (chronic)</option>
                </select>
              </div>

              {/* Context details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Context (triggers, medications taken, temperature)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Woke up with this after working long screen hours. Took acetaminophen 2 hours ago with slight relief."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Associated symptoms tag builder */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Associated Symptoms (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAssociated}
                    onChange={(e) => setNewAssociated(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAssociated(e))}
                    placeholder="e.g. Nausea, Sensitivity to light"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddAssociated}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>

                {associatedSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {associatedSymptoms.map((sym, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs"
                      >
                        <span>{sym}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAssociated(sym)}
                          className="hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy consent checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={consentToSave}
                  onChange={(e) => setConsentToSave(e.target.checked)}
                  className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="consentCheckbox" className="text-xs text-slate-600">
                  Save this assessment to my encrypted Health History record
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing with Clinical Triage AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Structured Assessment</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 space-y-4">
            {assessment ? (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5 animate-in fade-in">
                {/* Urgency Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Recommended Level of Care:
                    </span>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-extrabold border ${
                          assessment.urgencyLevel === "Emergency"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : assessment.urgencyLevel === "Urgent Care"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : assessment.urgencyLevel === "Routine Care"
                            ? "bg-teal-100 text-teal-900 border-teal-300"
                            : "bg-emerald-100 text-emerald-900 border-emerald-300"
                        }`}
                      >
                        {assessment.urgencyLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {savedSuccess && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Vault
                    </span>
                  )}
                </div>

                {/* Clinical Summary */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
                  <p className="font-bold text-slate-900 mb-1">Assessment Overview:</p>
                  <p>{assessment.summary}</p>
                </div>

                {/* Potential causes */}
                {assessment.potentialCauses?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      General Medical Considerations:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {assessment.potentialCauses.map((cause, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Questions for Doctor */}
                {assessment.questionsForDoctor?.length > 0 && (
                  <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-teal-700" />
                      Questions to Discuss With Your Physician:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-teal-900">
                      {assessment.questionsForDoctor.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-bold text-teal-700">{idx + 1}.</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conservative self-care */}
                {assessment.selfCareTips?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Conservative Self-Care &amp; Comfort Measures:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {assessment.selfCareTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 italic">
                  {assessment.disclaimer}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Ready for Symptom Assessment</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Enter your chief complaint, severity, and duration on the left. HealthMate will analyze clinical triage indicators and present personalized guidance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Past Symptom Assessments</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {pastAssessments.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400">No past symptom assessments saved.</p>
              ) : (
                pastAssessments.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{item.primarySymptom}</span>
                        <p className="text-[11px] text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()} • Severity: {item.severity}/10 • Duration: {item.duration}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {item.urgencyLevel}
                        </span>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete assessment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{item.aiSummary}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};
