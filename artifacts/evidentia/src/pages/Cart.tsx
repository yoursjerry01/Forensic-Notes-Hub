import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  CartItem,
  getCart,
  removeFromCart,
  getCartTotal,
} from "../lib/cart";

export function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  function refreshCart() {
    setCart(getCart());
  }

  useEffect(() => {
    refreshCart();

    window.addEventListener("cart-updated", refreshCart);

    return () => {
      window.removeEventListener("cart-updated", refreshCart);
    };
  }, []);

  const total = getCartTotal();

  function handleRemove(id: string) {
    removeFromCart(id);
    refreshCart();
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <Link
            href="/notes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <Link href="/">
            <img
              src="/logo.png"
              alt="Evidentia"
              className="object-contain"
              style={{ width: "150px", height: "auto" }}
            />
          </Link>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 lg:py-14">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">

            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-700" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Your Cart
            </h1>

          </div>

          <p className="text-gray-500">
            Review your selected study notes before continuing.
          </p>
        </div>

        {cart.length === 0 ? (

          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="text-gray-500 mt-2 mb-7">
              Explore our forensic science notes and add something to your cart.
            </p>

            <Link
              href="/notes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Browse Notes
            </Link>

          </div>

        ) : (

          <div className="grid lg:grid-cols-[1fr_360px] gap-8">

            <div className="space-y-4">

              {cart.map(item => (

                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6"
                >

                  <div className="flex items-start gap-4">

                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                        <div>

                          <h2 className="font-bold text-gray-900 text-lg">
                            {item.title}
                          </h2>

                          <p className="text-sm text-gray-500 mt-1">
                            {item.subject}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">

                            {item.note_type && (
                              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                                {item.note_type}
                              </span>
                            )}

                            {item.course && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                                {item.course}
                              </span>
                            )}

                          </div>

                        </div>

                        <div>
                          <p
                            className={`text-lg font-bold ${
                              item.is_free
                                ? "text-green-600"
                                : "text-gray-900"
                            }`}
                          >
                            {item.is_free
                              ? "FREE"
                              : `₹${item.price}`}
                          </p>
                        </div>

                      </div>

                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">

                        <span className="text-xs text-gray-400">
                          Digital PDF
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

            <aside className="lg:sticky lg:top-24 h-fit">

              <div className="bg-white border border-gray-200 rounded-2xl p-6">

                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3">

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Items
                    </span>

                    <span className="font-medium text-gray-900">
                      {cart.length}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Subtotal
                    </span>

                    <span className="font-medium text-gray-900">
                      ₹{total}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex justify-between">

                    <span className="font-bold text-gray-900">
                      Total
                    </span>

                    <span className="text-xl font-bold text-gray-900">
                      ₹{total}
                    </span>

                  </div>

                </div>

                <Link
  href="/checkout"
  className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
>
  Proceed to Checkout
  <ArrowRight className="w-5 h-5" />
</Link>

                <div className="mt-5 flex items-start gap-2 text-xs text-gray-400">

                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />

                  <span>
                    Secure checkout. Your purchased notes will be available
                    from your account.
                  </span>

                </div>

              </div>
              
            </aside>

          </div>

        )}

      </main>

    </div>
  );
}