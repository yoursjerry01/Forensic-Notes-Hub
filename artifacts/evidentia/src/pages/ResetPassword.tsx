import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

export function ResetPassword() {
  const [, navigate] = useLocation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const supabase = getSupabase();

        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        setValidSession(!!data.session);
      } catch {
        if (mounted) {
          setValidSession(false);
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        navigate("/auth/login");
      }, 2200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500">
          Verifying your reset link...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Animated background */}
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
      <header className="h-[76px] bg-white border-b border-gray-100 flex items-center justify-center relative z-10">
        <Link
          href="/auth/login"
          className="absolute left-6 md:left-10 inline-flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">
            Back to Login
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

      {/* Main */}
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
          transition={{
            duration: 0.45,
            delay: 0.05,
          }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Create a new password
          </h1>

          <p className="mt-3 text-lg text-gray-500 max-w-xl">
            Choose a strong password to secure your Evidentia
            account.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.1,
          }}
          className="w-full max-w-[560px] bg-white border border-gray-200 rounded-2xl shadow-sm p-7 md:p-10"
        >
          {!validSession ? (
            <div className="text-center py-5">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Reset link expired
              </h2>

              <p className="text-gray-500 mt-3 leading-relaxed">
                This password reset link is no longer valid.
                Please request a new one.
              </p>

              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center justify-center mt-7 h-12 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : success ? (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="text-center py-5"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Password updated
              </h2>

              <p className="text-gray-500 mt-3">
                Your password has been changed successfully.
              </p>

              <p className="text-sm text-gray-400 mt-4">
                Redirecting you to Sign In...
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="At least 6 characters"
                    className="w-full h-14 rounded-xl border border-gray-200 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    autoComplete="new-password"
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Enter your password again"
                    className="w-full h-14 rounded-xl border border-gray-200 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Update */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading
                  ? "Updating password..."
                  : "Update Password"}
              </button>
            </form>
          )}
        </motion.div>

        <div className="mt-7 text-sm text-gray-400 text-center">
          Your Evidentia account security matters.
        </div>
      </main>
    </div>
  );
}