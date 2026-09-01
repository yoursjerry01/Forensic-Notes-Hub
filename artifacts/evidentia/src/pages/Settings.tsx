import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  UserRound,
  Mail,
  ShieldCheck,
  Lock,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

export default function Settings() {
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        const supabase = getSupabase();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        if (!mounted) return;

        setEmail(session.user.email ?? "");
        setVerified(!!session.user.email_confirmed_at);
      } catch (error) {
        console.error("Unable to load account:", error);

        if (mounted) {
          navigate("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handlePasswordChange(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (password.length < 6) {
      setPasswordError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(
        "New password and confirmation password do not match."
      );
      return;
    }

    setUpdatingPassword(true);

    try {
      const supabase = getSupabase();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Your password has been updated successfully."
      );
    } catch (error: any) {
      console.error("Password update failed:", error);

      setPasswordError(
        error?.message ||
          "Unable to update your password. Please try again."
      );
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      const supabase = getSupabase();

      await supabase.auth.signOut();

      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-700 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            Loading account settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          <Link href="/">
            <img
              src="/logo.png"
              alt="Evidentia"
              className="cursor-pointer object-contain"
              style={{ width: "180px", height: "auto" }}
            />
          </Link>

          <Link
            href="/notes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-800 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            <UserRound className="w-4 h-4" />
            Browse Notes
          </Link>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Heading */}
        <section className="mb-8">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
              <UserRound className="w-7 h-7 text-gray-700" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Account Settings
              </h1>

              <p className="text-gray-500 mt-1">
                Manage your Evidentia account.
              </p>
            </div>

          </div>

        </section>

        {/* Account Information */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-5">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <UserRound className="w-5 h-5 text-blue-700" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Account Information
              </h2>

              <p className="text-sm text-gray-500">
                Your basic account details
              </p>
            </div>
          </div>

          <div className="space-y-5">

            {/* Email */}
            <div className="flex items-start gap-4">

              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />

              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email Address
                </p>

                <p className="text-gray-900 font-medium mt-1 break-all">
                  {email}
                </p>
              </div>

            </div>

            {/* Verification */}
            <div className="flex items-start gap-4">

              <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5" />

              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email Verification
                </p>

                {verified ? (
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-sm font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    Not Verified
                  </div>
                )}
              </div>

            </div>

          </div>

        </section>

        {/* Change Password */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-5">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-700" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Change Password
              </h2>

              <p className="text-sm text-gray-500">
                Choose a new password for your account.
              </p>
            </div>

          </div>

          <form
            onSubmit={handlePasswordChange}
            className="space-y-4"
          >

            {/* New password */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Enter new password again"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Error */}
            {passwordError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Success */}
            {passwordMessage && (
              <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-100 p-3 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{passwordMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={updatingPassword}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {updatingPassword && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              {updatingPassword
                ? "Updating..."
                : "Update Password"}
            </button>

          </form>

        </section>

        {/* Sign Out */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

            <div>
              <h2 className="font-bold text-gray-900">
                Sign Out
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Sign out of your Evidentia account on this device.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}

              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>

          </div>

        </section>

      </main>
    </div>
  );
}