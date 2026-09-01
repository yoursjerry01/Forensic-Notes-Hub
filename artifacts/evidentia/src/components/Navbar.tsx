import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  FileUp,
  BookOpen,
  ShoppingCart,
  LayoutDashboard,
  UserRound,
} from "lucide-react";

import { getCartCount } from "../lib/cart";
import { getSupabase } from "../lib/supabase";

export function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  // Refresh cart count
  function refreshCartCount() {
    setCartCount(getCartCount());
  }

  useEffect(() => {
    // Initial cart count
    refreshCartCount();

    window.addEventListener("cart-updated", refreshCartCount);

    // Supabase authentication
    const supabase = getSupabase();

    // Get current session
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

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          {/* =========================
              LOGO
          ========================== */}
          <Link href="/">
            <img
              src="/logo.png"
              alt="Evidentia"
              className="cursor-pointer object-contain"
              style={{
                width: "180px",
                height: "auto",
              }}
            />
          </Link>

          {/* =========================
              NAVIGATION
          ========================== */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">

            {/* =========================
                BROWSE NOTES
            ========================== */}
            <Link
              href="/notes"
              className="
                inline-flex
                items-center
                gap-1.5
                px-3
                sm:px-4
                py-2
                rounded-lg
                border
                border-gray-200
                text-gray-700
                text-sm
                font-semibold
                hover:bg-gray-50
                hover:border-gray-300
                transition-colors
              "
            >
              <BookOpen className="w-4 h-4" />

              <span className="hidden sm:inline">
                Browse Notes
              </span>

              <span className="sm:hidden">
                Notes
              </span>
            </Link>

            {/* =========================
                CART
            ========================== */}
            <Link
              href="/cart"
              className="
                relative
                inline-flex
                items-center
                gap-1.5
                px-3
                sm:px-4
                py-2
                rounded-lg
                border
                border-gray-200
                text-gray-700
                text-sm
                font-semibold
                hover:bg-gray-50
                hover:border-gray-300
                transition-colors
              "
            >
              <ShoppingCart className="w-4 h-4" />

              <span className="hidden sm:inline">
                Cart
              </span>

              {cartCount > 0 && (
                <span
                  className="
                    min-w-5
                    h-5
                    px-1.5
                    rounded-full
                    bg-blue-700
                    text-white
                    text-[11px]
                    font-bold
                    flex
                    items-center
                    justify-center
                  "
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* =========================
                LOGGED IN USER
            ========================== */}
            {user ? (
              <>
                {/* Student Dashboard */}
                <Link
                  href="/dashboard"
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    px-3
                    sm:px-4
                    py-2
                    rounded-lg
                    border
                    border-blue-200
                    bg-blue-50
                    text-blue-800
                    text-sm
                    font-semibold
                    hover:bg-blue-100
                    transition-colors
                  "
                >
                  <LayoutDashboard className="w-4 h-4" />

                  <span className="hidden sm:inline">
                    Dashboard
                  </span>

                  <span className="sm:hidden">
                    Dashboard
                  </span>
                </Link>

                {/* Submit Syllabus */}
                <Link
                  href="/submit-syllabus"
                  className="
                    hidden
                    md:inline-flex
                    items-center
                    gap-1.5
                    px-3
                    sm:px-4
                    py-2
                    rounded-lg
                    bg-blue-800
                    text-white
                    text-sm
                    font-semibold
                    hover:bg-blue-900
                    transition-colors
                    shadow-sm
                  "
                >
                  <FileUp className="w-4 h-4" />

                  Submit Syllabus
                </Link>
              </>
            ) : (
              <>
                {/* Submit Syllabus */}
                <Link
                  href="/submit-syllabus"
                  className="
                    hidden
                    md:inline-flex
                    items-center
                    gap-1.5
                    px-3
                    sm:px-4
                    py-2
                    rounded-lg
                    bg-blue-800
                    text-white
                    text-sm
                    font-semibold
                    hover:bg-blue-900
                    transition-colors
                    shadow-sm
                  "
                >
                  <FileUp className="w-4 h-4" />

                  Submit Syllabus
                </Link>

                {/* Login / Sign Up */}
                <Link
                  href="/login"
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    px-3
                    sm:px-4
                    py-2
                    rounded-lg
                    border
                    border-blue-200
                    text-blue-800
                    text-sm
                    font-semibold
                    hover:bg-blue-50
                    transition-colors
                  "
                >
                  <UserRound className="w-4 h-4" />

                  <span className="hidden sm:inline">
                    Login / Sign Up
                  </span>

                  <span className="sm:hidden">
                    Login
                  </span>
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}