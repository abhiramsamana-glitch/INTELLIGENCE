import React from "react";
import { Info } from "lucide-react";

interface MedicalDisclaimerProps {
  className?: string;
  variant?: "subtle" | "banner" | "card";
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  className = "",
  variant = "subtle",
}) => {
  if (variant === "banner") {
    return (
      <div
        className={`p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 ${className}`}
      >
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-amber-950">Clinical Disclaimer:</strong> HealthMate is designed for informational and educational health guidance only. It is not an automated medical diagnostic tool and does not formulate individualized pharmaceutical treatment regimens. For acute medical complaints or unexpected symptoms, consult a licensed healthcare practitioner promptly.
        </p>
      </div>
    );
  }

  return (
    <div className={`text-[11px] text-slate-400 text-center leading-relaxed ${className}`}>
      HealthMate guidance is informational and educational. Always consult a qualified medical professional for health diagnoses or treatment decisions. In case of an emergency, call your local emergency services immediately.
    </div>
  );
};
