import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { MedicalReport, MedicalReportResult } from "../types";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  Trash2,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Clock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

export const ReportAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload & Processing state
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Direct text paste alternative for laboratory portal copies
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.reports.getReports();
      setReports(res.reports);
      if (res.reports.length > 0 && !selectedReport) {
        setSelectedReport(res.reports[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileChange = (file: File) => {
    setAnalysisError(null);

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setAnalysisError("File exceeds the 15MB size limit. Please upload a smaller file.");
      return;
    }

    // Validate MIME type (PDF, PNG, JPEG, JPG)
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setAnalysisError("Unsupported file type. Please upload a PDF or image (PNG, JPG).");
      return;
    }

    setSelectedFile(file);

    // Read as Base64 for OCR/multimodal analysis
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    if (!fileBase64 && !pastedText.trim()) {
      setAnalysisError("Please select a report file or paste report text to analyze.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const payload: any = {};
      if (fileBase64 && selectedFile) {
        payload.base64Data = fileBase64;
        payload.mimeType = selectedFile.type;
      } else {
        payload.extractedText = pastedText;
      }

      const analyzed = await api.reports.analyzeReport(payload);

      // Save report and extracted biomarkers to private vault
      const saveRes = await api.reports.saveReport({
        reportTitle: analyzed.reportTitle || selectedFile?.name.replace(/\.[^/.]+$/, "") || "Lab Biomarker Report",
        reportType: "Laboratory",
        reportDate: analyzed.reportDate || new Date().toISOString().split("T")[0],
        laboratoryName: analyzed.laboratoryName || "Clinical Diagnostics",
        fileName: selectedFile?.name || "Pasted_Portal_Report.txt",
        fileType: selectedFile?.type || "text/plain",
        fileSizeBytes: selectedFile?.size || pastedText.length,
        overallSummary: analyzed.overallSummary,
        doctorQuestions: analyzed.doctorQuestions,
        results: analyzed.results,
      });

      setReports((prev) => [saveRes.report, ...prev]);
      setSelectedReport(saveRes.report);
      setSelectedFile(null);
      setFileBase64(null);
      setPastedText("");
      setPasteMode(false);
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed. Please check the document format.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Permanently delete this medical report and its extracted biomarkers?")) return;
    try {
      await api.reports.deleteReport(id);
      const remaining = reports.filter((r) => r.id !== id);
      setReports(remaining);
      setSelectedReport(remaining[0] || null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDownloadSummary = (report: MedicalReport) => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HealthMate_${report.reportTitle.replace(/\s+/g, "_")}_${report.reportDate}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Medical Report OCR &amp; Biomarker Analysis</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Upload blood work, metabolic panels, or pathology documents. Multimodal AI extracts test values, checks laboratory reference intervals, and translates complex findings into clear language.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Private encrypted vault (HIPAA &amp; RLS)</span>
        </div>
      </div>

      {analysisError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Upload Drag & Drop Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Upload New Medical Document</h3>
          <button
            onClick={() => setPasteMode(!pasteMode)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            {pasteMode ? "Switch to File Upload" : "Paste Text From Patient Portal"}
          </button>
        </div>

        {!pasteMode ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-teal-500 bg-teal-50/50"
                : selectedFile
                ? "border-emerald-400 bg-emerald-50/30"
                : "border-slate-200 hover:border-teal-400 bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Document"}
                </p>
                <p className="text-xs text-teal-700 font-semibold pt-1">
                  Ready to process with Gemini OCR
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Drag &amp; drop laboratory report here, or <span className="text-teal-600">browse files</span>
                </p>
                <p className="text-xs text-slate-400">
                  Supports PDF documents, PNG, and JPG scans (up to 15MB)
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Paste Raw Laboratory Text (from MyChart, Quest, Labcorp, etc.)
            </label>
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. Total Cholesterol: 212 mg/dL (Ref: < 200). Fasting Blood Sugar: 94 mg/dL (Ref: 70 - 99)..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {selectedFile && (
            <button
              onClick={() => {
                setSelectedFile(null);
                setFileBase64(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Clear
            </button>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing || (!selectedFile && !pastedText.trim())}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting Biomarkers &amp; Performing OCR...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract &amp; Analyze Biomarkers</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Report Inspection & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Saved Reports History List */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Your Lab Vault</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {reports.length}
            </span>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No reports stored in your vault yet.</p>
          ) : (
            <div className="space-y-2.5">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-50/80 border-teal-500 shadow-xs"
                        : "bg-slate-50 border-slate-200/80 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900">{rep.reportTitle}</h4>
                        <p className="text-[11px] text-slate-500">
                          {rep.reportDate} • {rep.laboratoryName || "Diagnostic Lab"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-md text-teal-800">
                        {rep.results?.length || 0} tests
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detailed Structured Biomarker Inspection */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          {selectedReport ? (
            <div className="space-y-6 animate-in fade-in">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {selectedReport.reportType} Report
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedReport.reportTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Date: {selectedReport.reportDate} • Laboratory: {selectedReport.laboratoryName || "Clinical Lab"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadSummary(selectedReport)}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                    title="Export JSON Summary"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReport(selectedReport.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Overall Patient-Language Summary */}
              {selectedReport.overallSummary && (
                <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-1.5 text-xs text-teal-950">
                  <p className="font-bold flex items-center gap-1.5 text-teal-900">
                    <Info className="w-4 h-4 text-teal-700" />
                    Plain-Language Clinical Summary:
                  </p>
                  <p className="leading-relaxed text-teal-900/90">{selectedReport.overallSummary}</p>
                </div>
              )}

              {/* Structured Biomarkers Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Extracted Biomarkers &amp; Reference Intervals ({selectedReport.results?.length || 0})
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-bold">Biomarker / Test Name</th>
                        <th className="py-3 px-4 font-bold">Result Value</th>
                        <th className="py-3 px-4 font-bold">Unit</th>
                        <th className="py-3 px-4 font-bold">Reference Interval</th>
                        <th className="py-3 px-4 font-bold">Status Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedReport.results || []).map((res, idx) => {
                        let flagBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";
                        if (res.flag === "High") flagBadge = "bg-amber-50 text-amber-800 border-amber-200 font-bold";
                        else if (res.flag === "Low") flagBadge = "bg-blue-50 text-blue-800 border-blue-200 font-bold";
                        else if (res.flag === "Critical") flagBadge = "bg-rose-50 text-rose-800 border-rose-300 font-extrabold";

                        return (
                          <React.Fragment key={idx}>
                            <tr className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">{res.testName}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">{res.measuredValue}</td>
                              <td className="py-3 px-4 text-slate-500">{res.unit || "—"}</td>
                              <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{res.referenceRange || "Standard"}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] border shadow-xs ${flagBadge}`}>
                                  {res.flag}
                                </span>
                              </td>
                            </tr>
                            {res.clinicalNote && (
                              <tr className="bg-slate-50/30">
                                <td colSpan={5} className="px-4 py-2 text-[11px] text-slate-600 border-b border-slate-100 italic">
                                  <strong>Meaning:</strong> {res.clinicalNote}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Questions for Physician */}
              {selectedReport.doctorQuestions?.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-teal-600" />
                    Recommended Questions for Your Healthcare Provider:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {selectedReport.doctorQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-teal-700">{idx + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select a report or upload a new one to view analysis</p>
            </div>
          )}
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
