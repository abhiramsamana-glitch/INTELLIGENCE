import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  HeartPulse,
  Mail,
  KeyRound,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface AuthPageProps {
  onSuccess: () => void;
  onBackToHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBackToHome }) => {
  const { sendOtp, verifyOtp, loginWithDemo, error: contextError } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === "code" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    setLocalError(null);
    setLoading(true);
    try {
      const res = await sendOtp(email);
      if (res.debugCode) {
        setDebugCode(res.debugCode);
      }
      setStep("code");
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setLocalError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setLocalError("Please enter the 6-digit verification code.");
      return;
    }

    setLocalError(null);
    setLoading(true);
    try {
      await verifyOtp(email, code.trim(), fullName);
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setLocalError(null);
    try {
      const res = await sendOtp(email);
      if (res.debugCode) setDebugCode(res.debugCode);
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await loginWithDemo();
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">HealthMate</span>
        </button>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {step === "email" ? "Sign in to your Health Vault" : "Enter Verification Code"}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {step === "email"
            ? "Secure, passwordless authentication using a 6-digit one-time code."
            : `We sent a one-time code to ${email}.`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/80 rounded-2xl border border-slate-200">
          {(localError || contextError) && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{localError || contextError}</span>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Optional for first-time profile)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send 6-Digit OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Dev/Preview instant code banner */}
              {debugCode && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Verification Code Generated:
                    </span>
                    <button
                      type="button"
                      onClick={() => setCode(debugCode)}
                      className="px-2 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold text-[11px] hover:bg-emerald-700"
                    >
                      Auto-fill {debugCode}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-center transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify Code & Sign In"}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || loading}
                  className="text-teal-700 hover:text-teal-800 font-semibold disabled:text-slate-400 transition-colors"
                >
                  {canResend ? "Resend Code" : `Resend in ${resendTimer}s`}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>One-Click Reviewer Access (Demo Profile)</span>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>End-to-End Row Level Security (RLS) Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
