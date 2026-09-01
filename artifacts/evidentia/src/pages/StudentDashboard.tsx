import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  UserRound,
  ShoppingBag,
  Download,
  ShoppingCart,
  BookOpen,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

export default function StudentDashboard() {
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const supabase = getSupabase();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          navigate("/login");
          return;
        }

        setEmail(session.user.email ?? "");
      } catch (error) {
        console.error("Unable to load student session:", error);
        navigate("/login");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSignOut() {
    try {
      const supabase = getSupabase();

      await supabase.auth.signOut();

      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            Loading your dashboard...
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
            <BookOpen className="w-4 h-4" />
            Browse Notes
          </Link>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome */}
        <section className="mb-8">
          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <UserRound className="w-7 h-7 text-blue-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">
                Student Dashboard
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back! 👋
              </h1>

              <p className="text-gray-500 mt-1">
                {email}
              </p>
            </div>

          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Orders */}
          <Link
            href="/orders"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-700" />
              </div>

              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>

            <h2 className="font-semibold text-gray-900 mt-4">
              My Orders
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              View your purchases
            </p>
          </Link>

          {/* Downloads */}
          <Link
            href="/downloads"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-green-700" />
              </div>

              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>

            <h2 className="font-semibold text-gray-900 mt-4">
              My Downloads
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Access your notes
            </p>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-700" />
              </div>

              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>

            <h2 className="font-semibold text-gray-900 mt-4">
              My Cart
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Review selected notes
            </p>
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-700" />
              </div>

              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>

            <h2 className="font-semibold text-gray-900 mt-4">
              Account Settings
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage your account
            </p>
          </Link>

        </section>

        {/* Account Information */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Account Information
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your Evidentia student account
              </p>
            </div>

            <UserRound className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Email Address
              </p>

              <p className="text-gray-900 font-medium break-all">
                {email}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Account Status
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Verified
              </div>
            </div>

          </div>

        </section>

        {/* Browse Notes */}
        <section className="bg-blue-800 rounded-xl p-6 sm:p-8 text-white">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

            <div>
              <h2 className="text-xl font-bold">
                Looking for study material?
              </h2>

              <p className="text-blue-100 mt-1">
                Explore forensic science notes and find the resources you need.
              </p>
            </div>

            <Link
              href="/notes"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-blue-800 font-semibold hover:bg-blue-50 transition-colors shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              Browse Notes
            </Link>

          </div>

        </section>

        {/* Sign Out */}
        <div className="flex justify-center mt-8">

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>

        </div>

      </main>
    </div>
  );
}