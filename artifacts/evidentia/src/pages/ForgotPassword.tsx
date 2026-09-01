import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        setError(error.message);
        return;
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">

      {/* Animated background elements */}
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
            Forgot your password?
          </h1>

          <p className="mt-3 text-lg text-gray-500 max-w-xl">
            No worries. Enter your email and we'll send you
            a secure link to reset your password.
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

          {!sent ? (
            <>
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                      className="w-full h-14 rounded-xl border border-gray-200 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      autoComplete="email"
                      autoFocus
                    />

                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

              </form>

              {/* Back */}
              <div className="text-center mt-7">

                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  Back to Sign In
                </Link>

              </div>
            </>
          ) : (
            /* Success state */
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
                Check your email
              </h2>

              <p className="text-gray-500 mt-3 leading-relaxed">
                We've sent a password reset link to:
              </p>

              <p className="font-semibold text-gray-900 mt-2 break-all">
                {email}
              </p>

              <p className="text-sm text-gray-400 mt-5">
                Click the link in the email to create
                a new password.
              </p>

              <div className="mt-7 pt-6 border-t border-gray-100">

                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>

              </div>

            </motion.div>
          )}

        </motion.div>

        {/* Security note */}
        <div className="mt-7 text-sm text-gray-400 text-center">
          Your password reset link is secure and
          expires according to your account settings.
        </div>

      </main>
    </div>
  );
}