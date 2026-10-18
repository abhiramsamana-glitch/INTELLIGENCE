import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Settings,
  User,
  ShieldCheck,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
} from "lucide-react";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, exportData, deleteAccount } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [preferredUnit, setPreferredUnit] = useState<"metric" | "imperial">(user?.preferredUnit || "metric");
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() || "175");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || "");
  const [gender, setGender] = useState(user?.gender || "prefer_not_to_say");

  // Consent toggles
  const [aiConsent, setAiConsent] = useState(true);
  const [ocrConsent, setOcrConsent] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPreferredUnit(user.preferredUnit || "metric");
      setHeightCm(user.heightCm?.toString() || "175");
      setDateOfBirth(user.dateOfBirth || "");
      setGender(user.gender || "prefer_not_to_say");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateProfile({
        fullName,
        preferredUnit,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender as any,
      });

      await api.privacy.updateConsent({
        aiProcessingConsented: aiConsent,
        reportOcrConsented: ocrConsent,
      });

      setSuccessMsg("Settings and privacy preferences updated successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      "WARNING: This will permanently delete your account, BMI measurements, lab reports, symptoms, and recipes. Type 'DELETE' to confirm:"
    );
    if (confirmation === "DELETE") {
      try {
        await deleteAccount();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Account Settings &amp; Privacy</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, preferred measurement systems, AI processing consents, and data export rights.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Measurement Unit
              </label>
              <select
                value={preferredUnit}
                onChange={(e: any) => setPreferredUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              >
                <option value="metric">Metric (kg, cm, ml)</option>
                <option value="imperial">Imperial (lbs, ft/in, fl oz)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Baseline Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Biological Sex / Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "female" | "male" | "other" | "prefer_not_to_say")}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy & Consent Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Privacy &amp; AI Processing Consents
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/50 transition-colors">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => setAiConsent(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 mt-0.5"
              />
              <div>
                <p className="font-bold text-slate-900">Consent for AI Clinical Triage &amp; Meal Generation</p>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                  Allows server-side Google GenAI processing of user-entered symptoms and dietary preferences strictly for real-time guidance. Your queries are never used to train public foundational models.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/50 transition-colors">
              <input
                type="checkbox"
                checked={ocrConsent}
                onChange={(e) => setOcrConsent(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 mt-0.5"
              />
              <div>
                <p className="font-bold text-slate-900">Consent for Medical Report OCR Extraction</p>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                  Authorizes multimodal scanning of uploaded PDF and image lab paperwork to extract structured biomarker numbers and reference intervals.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </form>

      {/* GDPR Data Rights & Account Deletion */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Data Portability &amp; Account Control (GDPR / HIPAA)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Download Data */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-teal-600" />
              Download All My Records
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Export an immediate JSON file containing all your recorded BMI logs, lab biomarker tables, symptom logs, meals, and workouts.
            </p>
            <button
              onClick={() => exportData()}
              className="mt-2 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              Export JSON Backup
            </button>
          </div>

          {/* Delete Account */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2">
            <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Permanently Delete Account
            </h4>
            <p className="text-[11px] text-rose-800/80 leading-relaxed">
              Irreversible action. Deletes your profile, all uploaded lab reports, symptom assessments, and biometric measurements from the database.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              Delete Account &amp; Data
            </button>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
