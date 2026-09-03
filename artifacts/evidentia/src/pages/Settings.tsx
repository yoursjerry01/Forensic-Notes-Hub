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
  Star,
  MessageSquareQuote,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

type Testimonial = {
  id: string;
  user_id: string;
  display_name: string;
  rating: number;
  content: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

export default function Settings() {
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Account identity */
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");

  /* Password */
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /* Testimonial */
  const [rating, setRating] = useState(0);
  const [testimonial, setTestimonial] = useState("");

  const [existingTestimonial, setExistingTestimonial] =
    useState<Testimonial | null>(null);

  const [loadingTestimonial, setLoadingTestimonial] = useState(true);
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [testimonialMessage, setTestimonialMessage] = useState("");
  const [testimonialError, setTestimonialError] = useState("");

  /* Sign out */
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
        setUserId(session.user.id);

        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "Student";

        setDisplayName(name);

        /* Load student's existing testimonial */
        const { data: testimonialData, error: testimonialError } =
          await supabase
            .from("testimonials")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (testimonialError) {
          console.error(
            "Unable to load testimonial:",
            testimonialError
          );
        }

        if (mounted) {
          setExistingTestimonial(testimonialData ?? null);
          setLoadingTestimonial(false);
        }
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

  async function handleTestimonialSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setTestimonialError("");
  setTestimonialMessage("");

  // Basic validation
  if (rating < 1 || rating > 5) {
    setTestimonialError("Please select a rating from 1 to 5 stars.");
    return;
  }

  if (!testimonial.trim()) {
    setTestimonialError("Please tell us about your experience.");
    return;
  }

  if (testimonial.trim().length < 10) {
    setTestimonialError(
      "Please write at least 10 characters about your experience."
    );
    return;
  }

  setSubmittingTestimonial(true);

  try {
    const supabase = getSupabase();

    // Get the actual authenticated Supabase user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      setTestimonialError(
        "You must be logged in to submit a testimonial."
      );
      return;
    }

    // Submit testimonial
    const { error } = await supabase
      .from("testimonials")
      .insert({
        user_id: user.id,
        display_name: displayName,
        rating: rating,
        content: testimonial.trim(),
        status: "pending",
      });

    if (error) {
      throw error;
    }

    // Success
    setTestimonialMessage(
      "Thank you for sharing your experience. Your testimonial has been submitted for review."
    );

    // Clear form
    setRating(0);
    setTestimonial("");

    // Show the newly submitted testimonial in the existing UI
    const now = new Date().toISOString();

    setExistingTestimonial({
      id: `${user.id}-${Date.now()}`,
      user_id: user.id,
      display_name: displayName,
      rating: rating,
      content: testimonial.trim(),
      status: "pending",
      created_at: now,
      updated_at: now,
    });

  } catch (error: any) {
    console.error("Testimonial submission failed:", error);

    setTestimonialError(
      error?.message ||
        "Unable to submit your testimonial. Please try again."
    );
  } finally {
    setSubmittingTestimonial(false);
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
              style={{
                width: "180px",
                height: "auto",
              }}
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

        {/* Share Your Experience */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-5">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquareQuote className="w-5 h-5 text-blue-700" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Share Your Experience
              </h2>

              <p className="text-sm text-gray-500">
                How was your experience with Evidentia?
              </p>
            </div>

          </div>

          {loadingTestimonial ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking your testimonial...
            </div>
          ) : existingTestimonial ? (
            <div className="space-y-4">

              {/* Existing rating */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </p>

                <div className="flex items-center gap-1">

                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= existingTestimonial.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}

                </div>
              </div>

              {/* Existing testimonial */}
              <div>

                <p className="text-sm font-medium text-gray-700 mb-2">
                  Your Experience
                </p>

                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {existingTestimonial.content}
                  </p>
                </div>

              </div>

              {/* Status */}
              {existingTestimonial.status === "pending" && (
                <div className="flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-100 p-3 text-sm text-yellow-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

                  <span>
                    Your testimonial has been submitted and is
                    currently waiting for review.
                  </span>
                </div>
              )}

              {existingTestimonial.status === "approved" && (
                <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-100 p-3 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />

                  <span>
                    Your testimonial has been approved and may
                    appear on the Evidentia homepage.
                  </span>
                </div>
              )}

              {existingTestimonial.status === "rejected" && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

                  <span>
                    Your testimonial was not approved for
                    publication.
                  </span>
                </div>
              )}

            </div>
          ) : (
            <form
              onSubmit={handleTestimonialSubmit}
              className="space-y-5"
            >

              {/* Student Name */}
              <div>

                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Your Name
                </p>

                <div className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-medium">
                  {displayName}
                </div>

                <p className="text-xs text-gray-400 mt-1.5">
                  Your name is automatically taken from your
                  account.
                </p>

              </div>

              {/* Rating */}
              <div>

                <p className="text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </p>

                <div className="flex items-center gap-1">

                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} out of 5`}
                      className="p-1 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}

                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      {rating}/5
                    </span>
                  )}

                </div>

              </div>

              {/* Testimonial */}
              <div>

                <label
                  htmlFor="testimonial"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Tell us about your experience
                </label>

                <textarea
                  id="testimonial"
                  value={testimonial}
                  onChange={(event) =>
                    setTestimonial(event.target.value)
                  }
                  placeholder="Tell us what you liked about Evidentia, how the notes helped you, or what you found useful..."
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />

                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400">
                    {testimonial.length}/1000
                  </span>
                </div>

              </div>

              {/* Error */}
              {testimonialError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{testimonialError}</span>
                </div>
              )}

              {/* Success */}
              {testimonialMessage && (
                <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-100 p-3 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{testimonialMessage}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submittingTestimonial}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >

                {submittingTestimonial && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {submittingTestimonial
                  ? "Submitting..."
                  : "Submit"}

              </button>

              <p className="text-xs text-gray-400">
                Your testimonial will be reviewed before it
                appears publicly on Evidentia.
              </p>

            </form>
          )}

        </section>

        {/* Sign Out */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

            <div>

              <h2 className="font-bold text-gray-900">
                Sign Out
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Sign out of your Evidentia account on this
                device.
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

              {signingOut
                ? "Signing Out..."
                : "Sign Out"}

            </button>

          </div>

        </section>

      </main>
    </div>
  );
}