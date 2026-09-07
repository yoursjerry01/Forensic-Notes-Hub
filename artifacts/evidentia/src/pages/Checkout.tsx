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
import { CartItem, clearCart, getCart } from "../lib/cart";

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
   * Checkout action
   *
   * The previous payment gateway has intentionally been removed.
   *
   * We will connect this button to the new secure payment
   * architecture after the backend and database cleanup is complete.
   *
   * Free orders can still be handled without a payment gateway.
   */
  async function handleContinueToPayment() {
  if (processing) return;

  try {
    setProcessing(true);

    const supabase = getSupabase();

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

    const currentCart = getCart();

    if (currentCart.length === 0) {
      navigate("/cart");
      return;
    }

    const paidTotal = currentCart.reduce((sum, item) => {
      return sum + (item.is_free ? 0 : Number(item.price || 0));
    }, 0);

    // Free order
    if (paidTotal <= 0) {
      alert("Your free notes are ready.");
      clearCart();
      navigate("/orders");
      return;
    }

    // 1. Create our Supabase order
    const orderNumber =
      `EVD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.user.id,
        order_number: orderNumber,
        status: "pending",
        subtotal: paidTotal,
        total_amount: paidTotal,
        currency: "INR",
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      throw orderError || new Error("Unable to create order.");
    }

    // 2. Add the cart items to the order
    const orderItems = currentCart.map((item) => ({
      order_id: order.id,
      note_id: item.id,
      note_title: item.title,
      unit_price: Number(item.is_free ? 0 : item.price || 0),
      quantity: 1,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      throw itemsError;
    }

    // 3. Ask our Edge Function to create the Razorpay order
    const { data: razorpayOrder, error: razorpayError } =
      await supabase.functions.invoke("create-razorpay-order", {
        body: {
          orderId: order.id,
        },
      });

    if (razorpayError || !razorpayOrder) {
      throw razorpayError || new Error("Unable to start payment.");
    }

    // 4. Load Razorpay Checkout if it isn't already loaded
    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");

        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Unable to load Razorpay checkout."));

        document.body.appendChild(script);
      });
    }

    // 5. Open Razorpay
    const options = {
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Evidentia",
      description: `Order ${razorpayOrder.orderNumber}`,
      order_id: razorpayOrder.razorpayOrderId,

      prefill: {
        email: session.user.email || "",
      },

      theme: {
        color: "#1d4ed8",
      },

     handler: async function (response: any) {
  try {
    console.log("Razorpay payment response:", response);

    const { data: verificationResult, error: verificationError } =
      await supabase.functions.invoke(
        "verify-razorpay-payment",
        {
          body: {
            orderId: order.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          },
        }
      );

    if (verificationError || !verificationResult?.success) {
      throw (
        verificationError ||
        new Error(
          verificationResult?.error ||
            "Payment verification failed."
        )
      );
    }

    setProcessing(false);

    alert("Payment completed successfully!");

    clearCart();

    navigate("/orders");
  } catch (error) {
    console.error("Payment verification failed:", error);

    setProcessing(false);

    const message =
      error instanceof Error
        ? error.message
        : "Payment verification failed.";

    alert(`Payment verification failed:\n\n${message}`);
  }
},

      modal: {
        ondismiss: function () {
          setProcessing(false);
        },
      },
    };

    const razorpay = new (window as any).Razorpay(options);

    razorpay.open();
  } catch (error) {
    console.error("Checkout failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while starting checkout.";

    alert(`Checkout failed:\n\n${message}`);
    setProcessing(false);
  }
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
            Review your order before continuing.
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
                    Your purchased study notes will be available
                    in your Evidentia account after successful
                    payment.
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
                    {total > 0 ? "Continue to Payment" : "Get Notes"}

                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="mt-5 flex items-start gap-2 text-xs text-gray-400">
                <Lock className="w-4 h-4 flex-shrink-0" />

                <span>
                  Secure checkout. Payment processing will be
                  connected through the new payment system.
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