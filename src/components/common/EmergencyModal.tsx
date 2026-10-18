import React from "react";
import { AlertTriangle, PhoneCall, X, ShieldAlert } from "lucide-react";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-rose-200">
        <div className="flex items-center justify-between pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Emergency Warning Screener</h3>
              <p className="text-xs text-rose-700 font-medium">When to seek immediate emergency medical care</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
            <p className="text-sm font-semibold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Do NOT delay emergency care for an online tool if you experience:
            </p>
            <ul className="mt-2 text-xs text-rose-800 space-y-1 list-disc list-inside">
              <li>Crushing pressure, pain, or tightness in your chest or upper abdomen</li>
              <li>Sudden severe shortness of breath or difficulty speaking</li>
              <li>Sudden numbness, weakness, or drooping on one side of your face or body</li>
              <li>Sudden confusion, difficulty understanding speech, or slurred words</li>
              <li>Sudden loss of vision in one or both eyes or thunderclap headache</li>
              <li>Severe uncontrollable bleeding, coughing up blood, or poisoning</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Immediate Emergency Dispatch:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="tel:911"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-sm shadow-xs transition-colors"
              >
                <PhoneCall className="w-4 h-4" /> 911 (US/CA)
              </a>
              <a
                href="tel:112"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-sm shadow-xs transition-colors"
              >
                <PhoneCall className="w-4 h-4" /> 112 (EU/Global)
              </a>
              <a
                href="tel:999"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-sm shadow-xs transition-colors"
              >
                <PhoneCall className="w-4 h-4" /> 999 (UK)
              </a>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed text-center">
            HealthMate provides non-prescriptive, supportive health information and is not a substitute for clinical diagnosis or emergency medical care.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition-colors"
          >
            I Understand — Proceed to App
          </button>
        </div>
      </div>
    </div>
  );
};
