import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Lock,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import { getSupabase } from "../lib/supabase";
import {
  CartItem,
  clearCart,
  getCart,
} from "../lib/cart";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayHandler = (response: RazorpayResponse) => void;

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  prefill?: {
    email?: string;
  };

  notes?: Record<string, string>;

  theme?: {
    color?: string;
  };

  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
  };

  handler: RazorpayHandler;
};

type RazorpayInstance = {
  open: () => void;
  close?: () => void;
};

type RazorpayConstructor = new (
  options: RazorpayOptions
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function Checkout() {
  const [, navigate] = useLocation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCheckout() {
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

        const currentCart = getCart();

        if (currentCart.length === 0) {
          navigate("/cart");
          return;
        }

        setEmail(session.user.email ?? "");
        setCart(currentCart);
      } catch (error) {
        console.error("Unable to load checkout:", error);
        navigate("/cart");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCheckout();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const total = cart.reduce((sum, item) => {
    return sum + (item.is_free ? 0 : Number(item.price || 0));
  }, 0);

  const paidItems = cart.filter((item) => !item.is_free);
  const freeItems = cart.filter((item) => item.is_free);

  /**
   * Load Razorpay Standard Checkout script.
   */
  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          resolve(Boolean(window.Razorpay));
        });

        existingScript.addEventListener("error", () => {
          resolve(false);
        });

        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        resolve(Boolean(window.Razorpay));
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  }

  /**
   * Extract a useful error message from Supabase function errors.
   */
  async function getFunctionErrorMessage(
    error: unknown,
    data?: unknown
  ): Promise<string> {
    if (data && typeof data === "object") {
      const responseData = data as {
        error?: string;
        message?: string;
      };

      if (responseData.error) {
        return responseData.error;
      }

      if (responseData.message) {
        return responseData.message;
      }
    }

    if (
      error &&
      typeof error === "object" &&
      "context" in error
    ) {
      try {
        const context = (error as { context?: Response }).context;

        if (context) {
          const body = await context.clone().json();

          if (body?.error) {
            return body.error;
          }

          if (body?.message) {
            return body.message;
          }
        }
      } catch {
        // Ignore parsing errors and use fallback below.
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  }

  /**
   * Verify the Razorpay payment on the server.
   *
   * IMPORTANT:
   * We do NOT mark the order as paid from the browser.
   * The verify-razorpay-payment Edge Function does that
   * after checking the Razorpay signature.
   */
  async function verifyPayment(
    response: RazorpayResponse,
    orderId: string
  ) {
    const supabase = getSupabase();

    const { data, error } = await supabase.functions.invoke(
      "verify-razorpay-payment",
      {
        body: {
          order_id: orderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        },
      }
    );

    if (error) {
      const message = await getFunctionErrorMessage(error, data);
      throw new Error(message);
    }

    if (!data) {
      throw new Error(
        "Payment verification returned no response."
      );
    }

    if (data.success === false) {
      throw new Error(
        data.error ||
          data.message ||
          "Payment verification failed."
      );
    }

    return data;
  }

  /**
   * Create the order through the secure Edge Function,
   * then open Razorpay Checkout.
   */
  async function handleContinueToPayment() {
    if (processing) return;

    try {
      setProcessing(true);

      const supabase = getSupabase();

      /*
       * ---------------------------------------------------------
       * 1. Check authentication
       * ---------------------------------------------------------
       */

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        navigate("/login");
        return;
      }

      /*
       * ---------------------------------------------------------
       * 2. Read the latest cart
       * ---------------------------------------------------------
       */

      const currentCart = getCart();

      if (currentCart.length === 0) {
        navigate("/cart");
        return;
      }

      /*
       * Only send note IDs and quantities.
       *
       * The Edge Function intentionally gets the real prices
       * directly from Supabase. We must never trust prices
       * coming from the browser.
       */
      const items = currentCart.map((item) => ({
        id: item.id,
        quantity: 1,
      }));

      /*
       * ---------------------------------------------------------
       * 3. Create order + Razorpay order
       * ---------------------------------------------------------
       */

      const { data, error } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            items,
          },
        }
      );

      if (error) {
        const message = await getFunctionErrorMessage(error, data);
        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Unable to create your payment order."
        );
      }

      /*
       * ---------------------------------------------------------
       * 4. Handle completely free order
       * ---------------------------------------------------------
       *
       * The Edge Function already marks free orders as paid.
       */

      if (data.free_order) {
        clearCart();

        alert(
          `Order ${data.order_number} created successfully.\n\n` +
            `Your free notes are now available in your account.`
        );

        navigate("/orders");
        return;
      }

      /*
       * ---------------------------------------------------------
       * 5. Validate Razorpay response
       * ---------------------------------------------------------
       */

      if (
        !data.order_id ||
        !data.razorpay_order_id ||
        !data.razorpay_key_id ||
        !data.amount ||
        !data.currency
      ) {
        console.error("Invalid Razorpay order response:", data);

        throw new Error(
          "Payment gateway returned incomplete order information."
        );
      }

      /*
       * ---------------------------------------------------------
       * 6. Load Razorpay Checkout
       * ---------------------------------------------------------
       */

      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load Razorpay Checkout. Please check your internet connection and try again."
        );
      }

      /*
       * ---------------------------------------------------------
       * 7. Open Razorpay
       * ---------------------------------------------------------
       */

      const noteNames = currentCart
        .map((item) => item.title)
        .filter(Boolean)
        .join(", ");

      const razorpayOptions: RazorpayOptions = {
        key: data.razorpay_key_id,

        amount: Number(data.amount),

        currency: data.currency,

        name: "Evidentia",

        description:
          noteNames.length > 100
            ? `${noteNames.substring(0, 97)}...`
            : noteNames || "Evidentia Study Notes",

        order_id: data.razorpay_order_id,

      prefill: {
  email:
    data.customer?.email ||
    session.user.email ||
    email ||
    undefined,
},

        notes: {
          supabase_order_id: data.order_id,
          order_number: data.order_number,
        },

        theme: {
          color: "#1d4ed8",
        },

        modal: {
          confirm_close: true,

          ondismiss: () => {
            /*
             * Payment was cancelled/closed.
             *
             * IMPORTANT:
             * We do not clear the cart.
             * The pending order remains in Supabase.
             */

            setProcessing(false);
          },
        },

        handler: async (
          razorpayResponse: RazorpayResponse
        ) => {
          try {
            /*
             * Razorpay has reported success.
             *
             * We still MUST verify the signature server-side
             * before treating the order as paid.
             */

            const verificationResult = await verifyPayment(
              razorpayResponse,
              data.order_id
            );

            console.log(
              "Razorpay payment verified:",
              verificationResult
            );

            clearCart();

            alert(
              `Payment successful!\n\n` +
                `Order: ${data.order_number}\n\n` +
                `Your purchased notes are now available in your Evidentia account.`
            );

            navigate("/orders");
          } catch (verificationError) {
            console.error(
              "Payment verification failed:",
              verificationError
            );

            const message =
              verificationError instanceof Error
                ? verificationError.message
                : "Payment verification failed.";

            alert(
              `Payment was received, but we could not verify it automatically.\n\n` +
                `${message}\n\n` +
                `Please do not pay again. Check My Orders or contact support.`
            );

            /*
             * Do NOT clear the cart if verification fails.
             *
             * The order remains pending so it can be investigated
             * safely instead of falsely marking it as paid.
             */
          } finally {
            setProcessing(false);
          }
        },
      };

      const razorpay = new window.Razorpay(
        razorpayOptions
      );

      razorpay.open();
    } catch (error) {
      console.error("Checkout failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while starting payment.";

      alert(`Checkout failed:\n\n${message}`);

      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

          <p className="text-sm text-gray-500">
            Preparing your checkout...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>

          <Link href="/">
            <img
              src="/logo.png"
              alt="Evidentia"
              className="object-contain"
              style={{
                width: "150px",
                height: "auto",
              }}
            />
          </Link>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10 lg:py-14">

        {/* Heading */}
        <div className="mb-10">

          <div className="flex items-center gap-3 mb-3">

            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-700" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Checkout
            </h1>

          </div>

          <p className="text-gray-500">
            Review your order before continuing to payment.
          </p>

        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">

          {/* Left */}
          <div className="space-y-6">

            {/* Account */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6">

              <div className="flex items-center gap-3 mb-5">

                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-blue-700" />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Your Account
                  </h2>

                  <p className="text-sm text-gray-500">
                    Signed in account used for this purchase
                  </p>
                </div>

              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-4">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                  Email Address
                </p>

                <p className="font-medium text-gray-900 break-all">
                  {email}
                </p>

              </div>

              <div className="flex items-center gap-2 mt-4 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                Your account is verified
              </div>

            </section>

            {/* Order Items */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <h2 className="font-bold text-gray-900">
                    Your Notes
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {cart.length} item
                    {cart.length !== 1 ? "s" : ""} in your order
                  </p>
                </div>

                <BookOpen className="w-5 h-5 text-gray-400" />

              </div>

              <div className="space-y-4">

                {cart.map((item) => (

                  <div
                    key={item.id}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >

                    <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>

                    <div className="flex-1 min-w-0">

                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {item.subject}
                      </p>

                      {item.course && (
                        <span className="inline-flex text-xs px-2 py-1 mt-2 rounded-full bg-gray-100 text-gray-600">
                          {item.course}
                        </span>
                      )}

                    </div>

                    <div className="text-right flex-shrink-0">

                      <p
                        className={`font-bold ${
                          item.is_free
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        {item.is_free
                          ? "FREE"
                          : `₹${Number(item.price).toFixed(2)}`}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </section>

            {/* Digital Delivery */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6">

              <div className="flex items-start gap-4">

                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>

                <div>

                  <h2 className="font-bold text-gray-900">
                    Digital Delivery
                  </h2>

                  <p className="text-sm text-gray-500 mt-1 leading-6">
                    Your purchased study notes will be available in
                    your Evidentia account after successful payment.
                  </p>

                </div>

              </div>

            </section>

          </div>

          {/* Right */}
          <aside className="lg:sticky lg:top-24 h-fit">

            <div className="bg-white border border-gray-200 rounded-2xl p-6">

              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-3">

                <div className="flex justify-between text-sm">

                  <span className="text-gray-500">
                    Total items
                  </span>

                  <span className="font-medium text-gray-900">
                    {cart.length}
                  </span>

                </div>

                {paidItems.length > 0 && (
                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Paid notes
                    </span>

                    <span className="font-medium text-gray-900">
                      {paidItems.length}
                    </span>

                  </div>
                )}

                {freeItems.length > 0 && (
                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Free notes
                    </span>

                    <span className="font-medium text-green-600">
                      {freeItems.length}
                    </span>

                  </div>
                )}

                <div className="border-t border-gray-100 pt-4 flex justify-between">

                  <span className="font-bold text-gray-900">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-gray-900">
                    ₹{total.toFixed(2)}
                  </span>

                </div>

              </div>

              <button
                type="button"
                onClick={handleContinueToPayment}
                disabled={processing}
                className={`w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-colors ${
                  processing
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800"
                }`}
              >

                {processing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

                    Processing...
                  </>
                ) : (
                  <>
                    {total > 0
                      ? "Continue to Payment"
                      : "Get Notes"}

                    <ArrowRight className="w-5 h-5" />
                  </>
                )}

              </button>

              <div className="mt-5 flex items-start gap-2 text-xs text-gray-400">

                <Lock className="w-4 h-4 flex-shrink-0" />

                <span>
                  Secure checkout. Payments are processed securely
                  through Razorpay.
                </span>

              </div>

            </div>

            <Link
              href="/cart"
              className="mt-4 w-full inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors"
            >
              Edit Cart
            </Link>

          </aside>

        </div>

      </main>

    </div>
  );
}