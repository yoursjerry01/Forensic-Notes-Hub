import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

export function VerifyEmail() {
  const [, navigate] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const initialEmail = params.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    otpInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setInterval(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  function handleOtpChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setOtp(digitsOnly);
    setError("");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();

      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "signup",
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);

      window.setTimeout(() => {
        navigate("/notes");
      }, 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify your email."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (countdown > 0) return;

    setResending(true);

    try {
      const supabase = getSupabase();

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("A new verification code has been sent to your email.");
      setCountdown(60);
      setOtp("");
      otpInputRef.current?.focus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend the verification code."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Subtle animated scientific background */}
      <motion.div
        className="absolute top-28 left-[-20px] w-16 h-16 rounded-full bg-blue-100/50 blur-sm"
        animate={{
          y: [0, -15, 0],
          x: [0, 8, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-52 right-[7%] w-3 h-3 rounded-full bg-cyan-300/60"
        animate={{
          y: [0, 18, 0],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-24 left-[15%] w-2 h-2 rounded-full bg-blue-300/60"
        animate={{
          y: [0, -12, 0],
          opacity: [0.3, 0.9, 0.3],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Header */}
      <header className="h-[76px] bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center justify-center relative z-10">
        <Link
          href="/auth/signup"
          className="absolute left-6 md:left-10 inline-flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">
            Back to Sign Up
          </span>
        </Link>

        <Link href="/">
          <img
            src="/logo.png"
            alt="Evidentia"
            className="w-[125px] object-contain"
          />
        </Link>
      </header>

      <main className="relative z-10 flex flex-col items-center px-5 pt-16 pb-12">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-6"
        >
          <Sparkles className="w-4 h-4" />
          Forensic Science Study Resources
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Verify your email
          </h1>

          <p className="mt-3 text-lg text-gray-500 max-w-xl">
            We've sent a 6-digit verification code to your email address.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[520px] bg-white border border-gray-200 rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.06)] p-7 md:p-10"
        >
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Email verified
              </h2>

              <p className="text-gray-500 mt-3">
                Your Evidentia account is ready.
              </p>

              <p className="text-sm text-gray-400 mt-4">
                Taking you to your study resources...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full h-14 rounded-xl border border-gray-200 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* OTP */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>

                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full h-14 rounded-xl border border-gray-200 px-4 text-center tracking-[0.45em] text-xl font-semibold text-gray-900 placeholder:text-gray-400 placeholder:tracking-normal outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <p className="mt-2 text-xs text-gray-400 text-center">
                  Check your inbox and spam folder.
                </p>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {message}
                </motion.div>
              )}

              {/* Verify */}
              <motion.button
                type="submit"
                disabled={loading || otp.length !== 6}
                whileHover={{
                  scale: loading || otp.length !== 6 ? 1 : 1.01,
                }}
                whileTap={{
                  scale: loading || otp.length !== 6 ? 1 : 0.98,
                }}
                className="w-full h-14 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </motion.button>

              {/* Resend */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      resending ? "animate-spin" : ""
                    }`}
                  />

                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : resending
                      ? "Sending code..."
                      : "Resend verification code"}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Trust */}
        <div className="mt-7 flex items-center gap-2 text-sm text-gray-400">
          <ShieldCheck className="w-4 h-4" />
          Secure account verification for Evidentia students
        </div>
      </main>
    </div>
  );
}