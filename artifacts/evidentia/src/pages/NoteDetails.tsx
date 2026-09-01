import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  FileText,
  ShoppingCart,
  Loader2,
  Check,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";
import { addToCart } from "../lib/cart";

type Note = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  note_type: string | null;
  course: string | null;
  file_url: string;
  file_name: string | null;
  tags: string[] | null;
  is_free: boolean;
  price: number | null;
  created_at: string;
};

const SUBJECT_COLORS: Record<string, string> = {
  "Forensic Chemistry": "bg-purple-100 text-purple-800",
  "Forensic Toxicology": "bg-amber-100 text-amber-800",
  "Forensic Biology": "bg-green-100 text-green-800",
  "DNA Analysis": "bg-indigo-100 text-indigo-800",
  "Forensic Physics": "bg-blue-100 text-blue-800",
  "Crime Scene Investigation": "bg-orange-100 text-orange-800",
  "Forensic Anthropology": "bg-rose-100 text-rose-800",
  "Document Examination": "bg-teal-100 text-teal-800",
  Ballistics: "bg-gray-100 text-gray-800",
  "Forensic Psychology": "bg-violet-100 text-violet-800",
  Other: "bg-slate-100 text-slate-700",
};

export function NoteDetails() {
  const [, params] = useRoute("/note/:id");
  const [, navigate] = useLocation();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadNote() {
      if (!params?.id) {
        setError("Note not found.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: supabaseError } = await getSupabase()
          .from("notes")
          .select("*")
          .eq("id", params.id)
          .single();

        if (supabaseError) {
          throw supabaseError;
        }

        setNote(data as Note);
      } catch (err) {
        console.error("Failed to load note:", err);
        setError("Unable to load this note.");
      } finally {
        setLoading(false);
      }
    }

    loadNote();
  }, [params?.id]);

  function handleAddToCart() {
    if (!note) return;

    const wasAdded = addToCart({
      id: note.id,
      title: note.title,
      subject: note.subject,
      note_type: note.note_type,
      course: note.course,
      price: note.price ?? 0,
      is_free: note.is_free,
      file_name: note.file_name,
    });

    if (wasAdded) {
      setAdded(true);

      setTimeout(() => {
        navigate("/cart");
      }, 500);
    } else {
      navigate("/cart");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading note...
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </Link>

          <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <FileText className="w-10 h-10 mx-auto text-gray-300 mb-4" />

            <h1 className="text-xl font-bold text-gray-900">
              Note not found
            </h1>

            <p className="text-gray-500 mt-2">
              This note may have been removed or is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const badgeColor =
    SUBJECT_COLORS[note.subject] ?? "bg-cyan-100 text-cyan-800";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-10 lg:py-14">

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">

          <div className="p-7 sm:p-10">

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-7">

              <span
                className={`text-sm font-semibold px-3 py-1.5 rounded-full ${badgeColor}`}
              >
                {note.subject}
              </span>

              {note.note_type && (
                <span className="text-sm font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
                  {note.note_type}
                </span>
              )}

            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              {note.title}
            </h1>

            {/* Course */}
            {note.course && (
              <p className="mt-4 text-gray-500">
                {note.course}
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 my-8" />

            {/* Description */}
            {note.description && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Topics Covered
                </h2>

                <div className="text-gray-600 leading-7 whitespace-pre-line">
                  {note.description}
                </div>
              </section>
            )}

            {/* File */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  Study Notes PDF
                </p>

                {note.file_name && (
                  <p className="text-sm text-gray-500 truncate">
                    {note.file_name}
                  </p>
                )}
              </div>

            </div>

            {/* Access */}
            <div className="mt-8 border-t border-gray-100 pt-8">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Access
                  </p>

                  <p
                    className={`text-2xl font-bold ${
                      note.is_free
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {note.is_free
                      ? "FREE"
                      : `₹${note.price ?? "—"}`}
                  </p>
                </div>

                {/* Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {note.is_free
                        ? "Get Free Note"
                        : "Add to Cart"}
                    </>
                  )}
                </button>

              </div>

            </div>

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Evidentia • Forensic Science Study Resources
        </p>

      </main>
    </div>
  );
}