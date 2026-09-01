import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  Package,
  CalendarDays,
  IndianRupee,
  FileText,
  Download,
  CheckCircle2,
  Clock3,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

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
};

type OrderItem = {
  id: string;
  order_id: string;
  note_id: string;
  note_title: string;
  unit_price: number;
  quantity: number;
};

type Note = {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
};

export default function OrderDetails() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/orders/:id");

  const orderId = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState<Record<string, Note>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      try {
        if (!orderId) {
          throw new Error("Order ID is missing.");
        }

        const supabase = getSupabase();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          navigate("/login");
          return;
        }

        // --------------------------------------------------
        // 1. Load the student's order
        // --------------------------------------------------

        const { data: orderData, error: orderError } = await supabase
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
              updated_at
            `
          )
          .eq("id", orderId)
          .eq("user_id", session.user.id)
          .single();

        if (orderError) {
          console.error("Unable to load order:", orderError);
          throw orderError;
        }

        if (!orderData) {
          throw new Error("Order not found.");
        }

        // --------------------------------------------------
        // 2. Load order items
        // --------------------------------------------------

        const { data: itemData, error: itemError } = await supabase
          .from("order_items")
          .select(
            `
              id,
              order_id,
              note_id,
              note_title,
              unit_price,
              quantity
            `
          )
          .eq("order_id", orderId)
          .order("created_at", { ascending: true });

        if (itemError) {
          console.error("Unable to load order items:", itemError);
          throw itemError;
        }

        const loadedItems = (itemData ?? []) as OrderItem[];

        // --------------------------------------------------
        // 3. Load the corresponding notes
        // --------------------------------------------------

        const noteIds = loadedItems
          .map((item) => item.note_id)
          .filter(Boolean);

        let loadedNotes: Note[] = [];

        if (noteIds.length > 0) {
          const { data: noteData, error: noteError } = await supabase
            .from("notes")
            .select(
              `
                id,
                title,
                subject,
                description,
                file_url,
                file_name
              `
            )
            .in("id", noteIds);

          if (noteError) {
            console.error("Unable to load notes:", noteError);
            throw noteError;
          }

          loadedNotes = (noteData ?? []) as Note[];
        }

        const noteMap: Record<string, Note> = {};

        for (const note of loadedNotes) {
          noteMap[note.id] = note;
        }

        if (mounted) {
          setOrder(orderData as Order);
          setItems(loadedItems);
          setNotes(noteMap);
        }
      } catch (error) {
        console.error("Unable to load order details:", error);

        if (mounted) {
          setError(
            "Unable to load this order. It may not exist or you may not have access to it."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [navigate, orderId]);

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

  function getStatus(status: string) {
    switch (status.toLowerCase()) {
      case "paid":
        return {
          label: "Paid",
          wrapper: "bg-green-50 text-green-700",
          dot: "bg-green-500",
          icon: CheckCircle2,
          message:
            "Payment successful. Your purchased notes are available.",
        };

      case "pending":
        return {
          label: "Payment Pending",
          wrapper: "bg-yellow-50 text-yellow-700",
          dot: "bg-yellow-600",
          icon: Clock3,
          message:
            "Your payment has not been confirmed yet. Download access will be available after successful payment.",
        };

      case "failed":
        return {
          label: "Payment Failed",
          wrapper: "bg-red-50 text-red-700",
          dot: "bg-red-500",
          icon: XCircle,
          message:
            "This payment was not completed. Please try checkout again.",
        };

      case "refunded":
        return {
          label: "Refunded",
          wrapper: "bg-purple-50 text-purple-700",
          dot: "bg-purple-500",
          icon: XCircle,
          message:
            "This order has been refunded. Download access is currently unavailable.",
        };

      case "cancelled":
      case "canceled":
        return {
          label: "Cancelled",
          wrapper: "bg-gray-100 text-gray-600",
          dot: "bg-gray-500",
          icon: XCircle,
          message:
            "This order has been cancelled.",
        };

      default:
        return {
          label:
            status.charAt(0).toUpperCase() +
            status.slice(1),
          wrapper: "bg-gray-100 text-gray-600",
          dot: "bg-gray-500",
          icon: Clock3,
          message: "Order status: " + status,
        };
    }
  }

  function handleDownload(note: Note) {
    if (!order || order.status.toLowerCase() !== "paid") {
      return;
    }

    if (!note.file_url) {
      alert("The study material is currently unavailable.");
      return;
    }

    window.open(note.file_url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

          <p className="text-gray-500 text-sm">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">

        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Orders
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-16">

          <div className="bg-white border border-red-200 rounded-2xl p-10 text-center">

            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-5">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>

            <h1 className="text-xl font-bold text-gray-900">
              Unable to load order
            </h1>

            <p className="text-gray-500 mt-2">
              {error || "This order could not be found."}
            </p>

            <Link
              href="/orders"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Orders
            </Link>

          </div>

        </main>
      </div>
    );
  }

  const status = getStatus(order.status);
  const StatusIcon = status.icon;

  const isPaid = order.status.toLowerCase() === "paid";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Orders
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

        {/* Heading */}
        <section className="mb-8">

          <div className="flex items-start gap-4">

            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-7 h-7 text-blue-700" />
            </div>

            <div className="min-w-0">

              <p className="text-sm text-gray-500 mb-1">
                Order Details
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                {items.length === 1
                  ? items[0]?.note_title || "Study Notes"
                  : `${items.length} Study Notes`}
              </h1>

              <p className="text-gray-500 mt-1">
                Order #{order.order_number}
              </p>

            </div>

          </div>

        </section>

        {/* Status */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div className="flex items-start gap-4">

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  isPaid
                    ? "bg-green-50"
                    : order.status.toLowerCase() === "failed"
                    ? "bg-red-50"
                    : "bg-yellow-50"
                }`}
              >
                <StatusIcon
                  className={`w-5 h-5 ${
                    isPaid
                      ? "text-green-600"
                      : order.status.toLowerCase() === "failed"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                />
              </div>

              <div>

                <h2 className="font-bold text-gray-900">
                  Payment Status
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {status.message}
                </p>

              </div>

            </div>

            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${status.wrapper}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${status.dot}`}
              />

              {status.label}
            </span>

          </div>

        </section>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">

          {/* Notes */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Your Notes
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {items.length}{" "}
                  {items.length === 1 ? "item" : "items"} in this order
                </p>
              </div>

              <FileText className="w-5 h-5 text-gray-400" />

            </div>

            <div className="space-y-4">

              {items.length === 0 ? (

                <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-sm text-gray-500">
                  No items were found for this order.
                </div>

              ) : (

                items.map((item) => {

                  const note = notes[item.note_id];

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-xl p-5"
                    >

                      <div className="flex items-start gap-4">

                        <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-700" />
                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                            <div className="min-w-0">

                              <h3 className="font-bold text-gray-900">
                                {item.note_title}
                              </h3>

                              {note?.subject && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {note.subject}
                                </p>
                              )}

                            </div>

                            <p className="font-bold text-gray-900 whitespace-nowrap">
                              {formatAmount(
                                Number(item.unit_price) *
                                  Number(item.quantity),
                                order.currency
                              )}
                            </p>

                          </div>

                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-400 mt-2">
                              Quantity: {item.quantity}
                            </p>
                          )}

                          {isPaid ? (

                            <button
                              type="button"
                              onClick={() => {
                                if (note) {
                                  handleDownload(note);
                                }
                              }}
                              disabled={!note?.file_url}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              {note?.file_url
                                ? "Download Note"
                                : "File Unavailable"}
                            </button>

                          ) : (

                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-sm font-semibold">
                              <Clock3 className="w-4 h-4" />
                              Available after payment
                            </div>

                          )}

                        </div>

                      </div>

                    </div>
                  );
                })

              )}

            </div>

          </section>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-6">

            <section className="bg-white border border-gray-200 rounded-2xl p-6">

              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4">

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Items
                  </span>

                  <span className="font-medium text-gray-900">
                    {items.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Order Date
                  </span>

                  <span className="font-medium text-gray-900">
                    {formatDate(order.created_at)}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="font-bold text-gray-900">
                      Total
                    </span>

                    <span className="text-xl font-bold text-gray-900">
                      {formatAmount(
                        order.total_amount,
                        order.currency
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </section>

            {/* Security */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6">

              <div className="flex items-start gap-3">

                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>

                <div>

                  <h3 className="text-sm font-bold text-gray-900">
                    Secure Purchase
                  </h3>

                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Your order is linked to your Evidentia account.
                    Purchased notes become available after successful
                    payment confirmation.
                  </p>

                </div>

              </div>

            </section>

          </aside>

        </div>

      </main>

    </div>
  );
}