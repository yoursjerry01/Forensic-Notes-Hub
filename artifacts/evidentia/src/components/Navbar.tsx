import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  FileUp,
  BookOpen,
  ShoppingCart,
  UserRound,
  LogOut,
} from "lucide-react";
import { getCartCount } from "../lib/cart";
import { getSupabase } from "../lib/supabase";

export function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  function refreshCartCount() {
    setCartCount(getCartCount());
  }

  useEffect(() => {
    // Refresh cart count
    refreshCartCount();

    window.addEventListener("cart-updated", refreshCartCount);

    // Supabase authentication
    const supabase = getSupabase();

    // Get the current session when Navbar loads
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Listen for login/logout/session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener("cart-updated", refreshCartCount);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = getSupabase();

    await supabase.auth.signOut();

    setUser(null);
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/">
          <img
            src="/logo.png"
            alt="Evidentia"
            className="cursor-pointer object-contain"
            style={{ width: "180px", height: "auto" }}
          />
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Browse Notes */}
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-blue-200 text-blue-800 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            <BookOpen className="w-4 h-4" />

            <span className="hidden sm:inline">
              Browse Notes
            </span>

            <span className="sm:hidden">
              Notes
            </span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />

            <span className="hidden sm:inline">
              Cart
            </span>

            {cartCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Authentication */}
          {user ? (
            <div className="flex items-center gap-2">

              {/* Logged in indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-semibold">
                <UserRound className="w-4 h-4" />

                <span>
                  Logged In
                </span>
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />

                <span className="hidden sm:inline">
                  Sign Out
                </span>

                <span className="sm:hidden">
                  Logout
                </span>
              </button>

            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-blue-200 text-blue-800 text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              <UserRound className="w-4 h-4" />

              <span className="hidden sm:inline">
                Login / Sign Up
              </span>

              <span className="sm:hidden">
                Login
              </span>
            </Link>
          )}

          {/* Submit Syllabus */}
          <Link
            href="/submit-syllabus"
            className="hidden md:inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors shadow-sm"
          >
            <FileUp className="w-4 h-4" />

            Submit Your Syllabus
          </Link>

        </div>
      </div>
    </header>
  );
}