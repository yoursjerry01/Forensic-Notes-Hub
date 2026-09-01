import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Package,
  CalendarDays,
  IndianRupee,
  ChevronRight,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

type OrderNote = {
  title: string;
  subject: string | null;
};

type OrderItem = {
  note_id: string;
  notes: OrderNote | OrderNote[] | null;
};

type Order = {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
};

export default function Orders() {
  const [, navigate] = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
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

        const { data, error } = await supabase
          .from("orders")
          .select(
            `
              id,
              user_id,
              order_number,
              status,
              subtotal,
              total_amount,
              currency,
              created_at,
              updated_at,
              order_items (
                note_id,
                notes (
                  title,
                  subject
                )
              )
            `
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Unable to load orders:", error);
          throw error;
        }

        if (mounted) {
          setOrders((data ?? []) as Order[]);
        }
      } catch (error) {
        console.error("Unable to load orders:", error);

        if (mounted) {
          setError(
            "Unable to load your orders. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function formatDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  function formatAmount(amount: number, currency: string) {
    if (currency === "INR") {
      return `₹${Number(amount).toFixed(2)}`;
    }

    return `${currency} ${Number(amount).toFixed(2)}`;
  }

  function getStatusStyles(status: string) {
    switch (status.toLowerCase()) {
      case "paid":
        return {
          wrapper: "bg-green-50 text-green-700",
          dot: "bg-green-500",
          label: "Paid",
        };

      case "pending":
        return {
          wrapper: "bg-yellow-50 text-yellow-700",
          dot: "bg-yellow-600",
          label: "Pending",
        };

      case "failed":
        return {
          wrapper: "bg-red-50 text-red-700",
          dot: "bg-red-500",
          label: "Failed",
        };

      case "cancelled":
      case "canceled":
        return {
          wrapper: "bg-gray-100 text-gray-600",
          dot: "bg-gray-500",
          label: "Cancelled",
        };

      case "refunded":
        return {
          wrapper: "bg-purple-50 text-purple-700",
          dot: "bg-purple-500",
          label: "Refunded",
        };

      default:
        return {
          wrapper: "bg-gray-100 text-gray-600",
          dot: "bg-gray-500",
          label:
            status.charAt(0).toUpperCase() +
            status.slice(1),
        };
    }
  }

  function getOrderNotes(order: Order): OrderNote[] {
    const notes: OrderNote[] = [];

    for (const item of order.order_items ?? []) {
      if (!item.notes) continue;

      const note = Array.isArray(item.notes)
        ? item.notes[0]
        : item.notes;

      if (note?.title) {
        notes.push(note);
      }
    }

    return notes;
  }

  function getOrderTitle(order: Order) {
    const notes = getOrderNotes(order);

    if (notes.length === 0) {
      return "Study Notes";
    }

    if (notes.length === 1) {
      return notes[0].title;
    }

    return `${notes.length} Study Notes`;
  }

  function getOrderDescription(order: Order) {
    const notes = getOrderNotes(order);

    if (notes.length === 0) {
      return "Digital study material";
    }

    if (notes.length === 1) {
      return notes[0].subject || "Digital study material";
    }

    const titles = notes.map((note) => note.title);

    if (titles.length === 2) {
      return `${titles[0]} + ${titles[1]}`;
    }

    return `${titles[0]}, ${titles[1]} + ${
      titles.length - 2
    } more`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

          <p className="text-gray-500 text-sm">
            Loading your orders...
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
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
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

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10 lg:py-14">

        {/* Page Heading */}
        <section className="mb-10">

          <div className="flex items-center gap-5">

            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-blue-700" />
            </div>

            <div>

              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                My Orders
              </h1>

              <p className="text-gray-500 mt-2">
                View your Evidentia purchases and order history.
              </p>

            </div>

          </div>

        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 ? (

          <section className="bg-white border border-gray-200 rounded-2xl p-10 sm:p-16 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Package className="w-8 h-8 text-gray-400" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              No orders yet
            </h2>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              You haven't purchased any study notes yet.
              Browse our collection and find something useful
              for your studies.
            </p>

            <Link
              href="/notes"
              className="inline-flex items-center gap-2 mt-7 px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Notes
            </Link>

          </section>

        ) : (

          /* Orders */
          <section className="space-y-4">

            {orders.map((order) => {

              const status = getStatusStyles(order.status);
              const notes = getOrderNotes(order);

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 hover:border-blue-300 hover:shadow-sm transition-all group"
                >

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

                    {/* Left */}
                    <div className="flex items-start gap-4">

                      <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-700" />
                      </div>

                      <div className="min-w-0">

                        {/* Note title */}
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                          {getOrderTitle(order)}
                        </h2>

                        {/* Subject / multiple notes */}
                        <p className="text-sm text-gray-500 mt-1">
                          {getOrderDescription(order)}
                        </p>

                        {/* Order reference */}
                        <p className="text-xs text-gray-400 mt-2">
                          Order #{order.order_number}
                        </p>

                        {/* Date + Amount */}
                        <div className="flex flex-wrap items-center gap-4 mt-4">

                          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                            <CalendarDays className="w-4 h-4" />
                            {formatDate(order.created_at)}
                          </div>

                          <div className="inline-flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                            <IndianRupee className="w-4 h-4" />

                            {formatAmount(
                              order.total_amount,
                              order.currency
                            ).replace("₹", "")}
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* Right */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">

                      <span
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold ${status.wrapper}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${status.dot}`}
                        />

                        {status.label}
                      </span>

                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />

                    </div>

                  </div>

                </Link>
              );
            })}

          </section>

        )}

      </main>

    </div>
  );
}