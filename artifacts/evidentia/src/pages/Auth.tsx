import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

type AuthMode = "login" | "signup";

export function Auth({ mode = "login" }: { mode?: AuthMode }) {
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";

  useEffect(() => {
    setError("");
    setMessage("");
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (isSignup) {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = getSupabase();

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setError(error.message);
          return;
        }

        /*
         * With email confirmation enabled, Supabase normally returns
         * a user without an active session.
         */
        if (data.user && !data.session) {
          navigate(`/auth/verify?email=${encodeURIComponent(email.trim())}`);
          return;
        }

        setMessage("Your account has been created successfully.");
        navigate("/notes");
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          navigate("/notes");
        }
      }
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

  async function handleGoogle() {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = getSupabase();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue with Google."
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decorative animated elements */}
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

      <motion.div
        className="absolute bottom-40 right-[-15px] w-12 h-12 rounded-full bg-cyan-100/60 blur-sm"
        animate={{
          y: [0, 12, 0],
          rotate: [0, 8, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Header */}
      <header className="h-[76px] bg-white border-b border-gray-100 flex items-center justify-center relative z-10">
        <Link
          href="/notes"
          className="absolute left-6 md:left-10 inline-flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">
            Back to Notes
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
      <main className="relative z-10 flex flex-col items-center px-5 pt-14 pb-12">
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
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>

          <p className="mt-3 text-lg text-gray-500">
            {isSignup
              ? "Join Evidentia and keep your study resources organized."
              : "Sign in to continue your learning journey with Evidentia."}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[560px] bg-white border border-gray-200 rounded-2xl shadow-sm p-7 md:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            {isSignup && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full h-14 rounded-xl border border-gray-200 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

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
                  className="w-full h-14 rounded-xl border border-gray-200 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>

                {!isSignup && (
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isSignup
                      ? "At least 6 characters"
                      : "Enter your password"
                  }
                  className="w-full h-14 rounded-xl border border-gray-200 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
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

            {/* Confirm Password */}
            {isSignup && (
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
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* Main button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-400">
              or continue with
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-14 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 text-gray-700 font-semibold disabled:opacity-60"
          >
            <span className="font-bold text-lg">G</span>
            Continue with Google
          </button>

          {/* Switch */}
          <div className="text-center mt-7 text-gray-500">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-blue-700 hover:text-blue-900"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-blue-700 hover:text-blue-900"
                >
                  Create an account
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Footer reassurance */}
        <div className="mt-7 flex items-center gap-2 text-sm text-gray-400">
          <ShieldCheck className="w-4 h-4" />
          Secure account access for Evidentia students
        </div>
      </main>
    </div>
  );
}