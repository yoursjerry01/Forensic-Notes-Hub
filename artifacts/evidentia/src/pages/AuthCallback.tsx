import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, ShieldCheck } from "lucide-react";
import { getSupabase } from "../lib/supabase";

export function AuthCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        const supabase = getSupabase();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          navigate("/notes");
          return;
        }

        setError("Unable to complete authentication.");
      } catch {
        if (mounted) {
          setError("Unable to complete authentication.");
        }
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">
              Authentication failed
            </h1>

            <p className="mt-3 text-gray-500">{error}</p>

            <button
              onClick={() => navigate("/auth/login")}
              className="mt-6 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-blue-600" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              Signing you in...
            </h1>

            <p className="mt-2 text-gray-500">
              Please wait while we complete your authentication.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4" />
              Secure Evidentia authentication
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}