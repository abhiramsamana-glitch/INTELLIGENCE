import React from "react";
import { ShieldCheck, Lock, FileText, Database, Bot, CheckCircle2 } from "lucide-react";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Privacy, Security &amp; Clinical Disclaimers</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          How HealthMate safeguards your health records, enforces Row Level Security (RLS), and bounds artificial intelligence queries.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 pt-1">Row Level Security (RLS)</h4>
            <p className="text-[11px] text-slate-500">
              PostgreSQL policies guarantee that database queries are scoped exclusively to <code className="text-teal-800">auth.uid() = user_id</code>. No user can view another's data.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 pt-1">Private Document Buckets</h4>
            <p className="text-[11px] text-slate-500">
              Uploaded laboratory reports are stored in private storage with short-lived tokens. Files are never publicly addressable on the web.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 pt-1">Strict AI Processing</h4>
            <p className="text-[11px] text-slate-500">
              Model requests are handled via server-side proxies without exposing API credentials. Queries are transiently processed and never retained to train public models.
            </p>
          </div>
        </div>

        {/* Section 1: Non-Diagnostic Medical Scope */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            1. Clinical Information vs. Medical Diagnosis
          </h3>
          <p>
            HealthMate is designed solely as an informational, educational, and habit-tracking platform. None of the algorithms, automated symptom assessments, laboratory OCR extractions, or chatbot responses constitute a medical diagnosis, clinical prognosis, or personalized pharmaceutical prescription.
          </p>
          <p>
            An out-of-range laboratory biomarker does not automatically prove pathology, nor does a normal result rule out disease. Laboratory reference intervals vary between instruments and clinical contexts. Always consult your personal physician for clinical interpretation.
          </p>
        </div>

        {/* Section 2: Data Ownership & GDPR Portability */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            2. User Data Ownership &amp; GDPR Portability
          </h3>
          <p>
            You retain absolute ownership of all personal data entered into HealthMate. Under GDPR and healthcare privacy best practices:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
            <li><strong>Right to Export:</strong> Download all your records in standard JSON format at any time from Settings.</li>
            <li><strong>Right to Erasure:</strong> Delete your account and purge all measurements, symptoms, lab reports, and meal logs permanently.</li>
            <li><strong>Zero Commercial Data Selling:</strong> HealthMate never sells, monetizes, or shares health records with third-party advertisers or insurance brokers.</li>
          </ul>
        </div>

        {/* Section 3: Emergency Protocol */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            3. Emergency Care Disclaimer
          </h3>
          <p>
            If you are experiencing acute chest pain, sudden difficulty breathing, signs of stroke (facial drooping, slurred speech), heavy uncontrolled bleeding, or suicidal thoughts, do NOT use this application. Contact local emergency dispatch immediately (<strong>911</strong> in the US/Canada, <strong>112</strong> in Europe/Global, or <strong>999</strong> in the UK).
          </p>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
