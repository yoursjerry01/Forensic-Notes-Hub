import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Download as DownloadIcon,
  FileText,
  CalendarDays,
  Loader2,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

type DownloadItem = {
  id: string;
  noteId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  purchasedAt: string;
};

export default function Downloads() {
  const [, navigate] = useLocation();

  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDownloads() {
  try {
    const supabase = getSupabase();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/login");
      return;
    }

    /*
     * =====================================================
     * 1. PAID NOTES
     * =====================================================
     */

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, created_at, status")
      .eq("user_id", session.user.id)
      .in("status", ["paid", "completed"])
      .order("created_at", { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    const paidDownloads: DownloadItem[] = [];

    if (orders && orders.length > 0) {
      const orderIds = orders.map((order) => order.id);

      const { data: orderItems, error: itemsError } =
        await supabase
          .from("order_items")
          .select("id, order_id, note_id")
          .in("order_id", orderIds);

      if (itemsError) {
        throw itemsError;
      }

      if (orderItems && orderItems.length > 0) {
        const noteIds = [
          ...new Set(
            orderItems
              .map((item) => item.note_id)
              .filter(Boolean)
          ),
        ];

        if (noteIds.length > 0) {
          const { data: notes, error: notesError } =
            await supabase
              .from("notes")
              .select(
                "id, title, file_name, file_url"
              )
              .in("id", noteIds);

          if (notesError) {
            throw notesError;
          }

          const noteMap = new Map(
            (notes ?? []).map((note) => [
              note.id,
              note,
            ])
          );

          const orderDateMap = new Map(
            orders.map((order) => [
              order.id,
              order.created_at,
            ])
          );

          for (const item of orderItems) {
            const note = noteMap.get(item.note_id);

            if (!note) continue;

            paidDownloads.push({
              id: `paid-${item.id}`,
              noteId: item.note_id,
              title: note.title,
              fileName: note.file_name,
              fileUrl: note.file_url,
              purchasedAt:
                orderDateMap.get(item.order_id) ?? "",
            });
          }
        }
      }
    }

    /*
     * =====================================================
     * 2. FREE NOTES
     * =====================================================
     */

    const { data: freeSaves, error: freeError } =
      await supabase
        .from("free_note_saves")
        .select(
          "id, note_id, created_at"
        )
        .eq("user_id", session.user.id)
        .order("created_at", {
          ascending: false,
        });

    if (freeError) {
      throw freeError;
    }

    const freeDownloads: DownloadItem[] = [];

    if (freeSaves && freeSaves.length > 0) {
      const freeNoteIds = [
        ...new Set(
          freeSaves
            .map((item) => item.note_id)
            .filter(Boolean)
        ),
      ];

      if (freeNoteIds.length > 0) {
        const { data: freeNotes, error: freeNotesError } =
          await supabase
            .from("notes")
            .select(
              "id, title, file_name, file_url"
            )
            .in("id", freeNoteIds);

        if (freeNotesError) {
          throw freeNotesError;
        }

        const freeNoteMap = new Map(
          (freeNotes ?? []).map((note) => [
            note.id,
            note,
          ])
        );

        for (const save of freeSaves) {
          const note = freeNoteMap.get(save.note_id);

          if (!note) continue;

          freeDownloads.push({
            id: `free-${save.id}`,
            noteId: save.note_id,
            title: note.title,
            fileName: note.file_name,
            fileUrl: note.file_url,
            purchasedAt: save.created_at,
          });
        }
      }
    }

    /*
     * =====================================================
     * 3. COMBINE
     * =====================================================
     */

    const combined = [
      ...paidDownloads,
      ...freeDownloads,
    ].sort(
      (a, b) =>
        new Date(b.purchasedAt).getTime() -
        new Date(a.purchasedAt).getTime()
    );

    if (mounted) {
      setDownloads(combined);
    }

  } catch (err) {
    console.error(
      "Unable to load downloads:",
      err
    );

    if (mounted) {
      setError(
        "Unable to load your downloads. Please try again."
      );
    }
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
}

    loadDownloads();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function formatDate(date: string) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

 async function openDownload(
  noteId: string,
  url: string
) {
  if (!url) return;

  const supabase = getSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    navigate("/login");
    return;
  }

  const { error } = await supabase
    .from("note_downloads")
    .insert({
      note_id: noteId,
      user_id: session.user.id,
    });

  if (error) {
    console.error(
      "Unable to record download:",
      error
    );
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
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

            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
              <DownloadIcon className="w-7 h-7 text-green-700" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Downloads
              </h1>

              <p className="text-gray-500 mt-1">
                 Access your purchased and saved study notes.
              </p>
            </div>

          </div>

        </section>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">

            <Loader2 className="w-8 h-8 text-blue-700 animate-spin mx-auto mb-3" />

            <p className="text-gray-500 text-sm">
              Loading your downloads...
            </p>

          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">

            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>

            <p className="text-red-600 font-medium">
              {error}
            </p>

          </div>
        )}

        {/* Empty */}
        {!loading && !error && downloads.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">

            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              No downloads yet
            </h2>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
             Notes you purchase or save for free will appear here
for easy access anytime.
            </p>

            <Link
              href="/notes"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Browse Notes
            </Link>

          </div>
        )}

        {/* Downloads */}
        {!loading && !error && downloads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {downloads.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
              >

                <div className="flex items-start gap-4">

                  {/* File icon */}
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">

                    <h2 className="font-semibold text-gray-900 text-lg">
                      {item.title}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {item.fileName}
                    </p>

                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-3">
                      <CalendarDays className="w-4 h-4" />
                      Added {formatDate(item.purchasedAt)}
                    </div>

                    {/* Download */}
                    <button
                      type="button"
                     onClick={() =>
  openDownload(item.noteId, item.fileUrl)
}
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      Open / Download
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </main>
    </div>
  );
}