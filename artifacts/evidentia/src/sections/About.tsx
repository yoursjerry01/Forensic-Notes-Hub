import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { BookOpen, FileText, ArrowRight } from "lucide-react";
import { getSupabase } from "../lib/supabase";

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

export function About() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestNotes();
  }, []);

  async function fetchLatestNotes() {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("notes")
        .select(
          "id, title, subject, description, note_type, course, file_url, file_name, tags, is_free, price, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Could not fetch latest notes:", error);
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.error("Latest notes error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-20 bg-gray-50 border-y border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* =========================
            SECTION HEADER
        ========================== */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold tracking-widest uppercase text-blue-600 mb-3"
          >
            Latest Resources
          </motion.p>

          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">
            Explore the latest notes.
          </h2>

          <p className="text-lg text-gray-600 leading-relaxed">
            Discover recently added forensic science notes, organized for
            clearer learning and exam preparation.
          </p>
        </motion.div>

        {/* =========================
            LOADING STATE
        ========================== */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: item * 0.1,
                }}
                className="h-64 rounded-2xl border border-gray-200 bg-white animate-pulse"
              />
            ))}
          </div>
        )}

        {/* =========================
            LATEST NOTES
        ========================== */}
        {!loading && notes.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{
                    opacity: 0,
                    y: 35,
                    scale: 0.97,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  viewport={{
                    once: true,
                    margin: "-80px",
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{
                    y: -6,
                  }}
                  className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
                >

                  {/* =========================
                      ICON + PRICE
                  ========================== */}
                  <div className="flex items-start justify-between mb-5">

                    <motion.div
                      whileHover={{
                        scale: 1.08,
                        rotate: -3,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                      className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"
                    >
                      <FileText className="w-6 h-6 text-blue-700" />
                    </motion.div>

                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        note.is_free
                          ? "bg-green-50 text-green-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {note.is_free
                        ? "Free"
                        : `₹${Number(note.price || 0).toFixed(0)}`}
                    </span>
                  </div>

                  {/* =========================
                      NOTE INFORMATION
                  ========================== */}
                  <div className="mb-6">

                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                      {note.subject}
                    </p>

                    <h3 className="text-lg font-semibold text-gray-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors">
                      {note.title}
                    </h3>

                    <div className="space-y-1.5 text-sm text-gray-500">

                      {note.note_type && (
                        <p>
                          <span className="font-medium text-gray-700">
                            Type:
                          </span>{" "}
                          {note.note_type}
                        </p>
                      )}

                      {note.course && (
                        <p>
                          <span className="font-medium text-gray-700">
                            Course:
                          </span>{" "}
                          {note.course}
                        </p>
                      )}

                    </div>
                  </div>

                  {/* =========================
                      VIEW NOTE
                  ========================== */}
                  <Link
                    href={`/notes/${note.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                  >
                    View Note

                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                </motion.div>
              ))}
            </div>

            {/* =========================
                BROWSE ALL NOTES
            ========================== */}
            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.5,
                delay: 0.35,
              }}
              className="flex justify-center mt-10"
            >
              <Link
                href="/notes"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
              >
                Browse All Notes

                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </>
        )}

        {/* =========================
            EMPTY STATE
        ========================== */}
        {!loading && notes.length === 0 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
            }}
            className="text-center py-10"
          >
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4"
            >
              <BookOpen className="w-7 h-7 text-blue-300" />
            </motion.div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Notes are coming soon.
            </h3>

            <p className="text-gray-500 mb-6">
              We're preparing structured forensic science resources for you.
            </p>

            <Link
              href="/notes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Browse Notes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

      </div>
    </section>
  );
}