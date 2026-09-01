import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Dna,
  ShieldCheck,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

export function Login() {
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("Login successful. Welcome back!");

      setTimeout(() => {
        navigate("/notes");
      }, 700);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Subtle scientific background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-20 top-32 text-blue-100"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 3, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Dna className="w-64 h-64 opacity-40" strokeWidth={1} />
        </motion.div>

        <motion.div
          className="absolute -right-16 bottom-20 text-cyan-100"
          animate={{
            y: [0, 18, 0],
            rotate: [0, -4, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Dna className="w-72 h-72 opacity-35" strokeWidth={1} />
        </motion.div>

        <div className="absolute left-[15%] top-[25%] w-2 h-2 rounded-full bg-blue-200 opacity-50" />
        <div className="absolute right-[18%] top-[30%] w-1.5 h-1.5 rounded-full bg-cyan-200 opacity-60" />
        <div className="absolute left-[20%] bottom-[25%] w-1.5 h-1.5 rounded-full bg-blue-200 opacity-50" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-20 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto h-full px-6 md:px-10 flex items-center justify-between">
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </Link>

          <Link href="/">
            <img
              src="/logo.png"
              alt="Evidentia"
              className="object-contain"
              style={{ width: "145px" }}
            />
          </Link>

          <div className="w-[110px]" />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Small identity badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-center mb-5"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
              <Dna className="w-4 h-4" />
              Forensic Science Study Resources
            </div>
          </motion.div>

          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h1>

            <p className="mt-2 text-gray-500 text-sm md:text-base">
              Sign in to continue your learning journey with Evidentia.
            </p>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="bg-white border border-gray-200 rounded-2xl p-7 md:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
          >
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              {/* Success */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700"
                >
                  {message}
                </motion.div>
              )}

              {/* Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold shadow-sm hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Signing in..." : "Sign In"}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-gray-400">Evidentia Account</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* Signup */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Trust line */}
          <div className="flex justify-center items-center gap-2 mt-6 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure account access for Evidentia students</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}