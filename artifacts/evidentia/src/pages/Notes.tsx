import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Download, BookOpen, Search, Filter,
  FileText, ChevronDown, ExternalLink, Sparkles
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

type Note = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  semester: string | null;
  course: string | null;
  file_url: string;
  file_name: string | null;
  tags: string[] | null;
  is_free: boolean;
  created_at: string;
};

const SUBJECTS = [
  "All Subjects",
  "Forensic Chemistry",
  "Forensic Toxicology",
  "Forensic Biology",
  "DNA Analysis",
  "Forensic Physics",
  "Crime Scene Investigation",
  "Forensic Anthropology",
  "Document Examination",
  "Ballistics",
  "Forensic Psychology",
  "Other",
];

const SEMESTERS = [
  "All Semesters",
  "Year 1 / Sem 1",
  "Year 1 / Sem 2",
  "Year 2 / Sem 3",
  "Year 2 / Sem 4",
  "Year 3 / Sem 5",
  "Year 3 / Sem 6",
  "M.Sc Year 1",
  "M.Sc Year 2",
];

const SUBJECT_COLORS: Record<string, string> = {
  "Forensic Chemistry": "bg-amber-100 text-amber-800",
  "Forensic Toxicology": "bg-red-100 text-red-800",
  "Forensic Biology": "bg-green-100 text-green-800",
  "DNA Analysis": "bg-purple-100 text-purple-800",
  "Forensic Physics": "bg-blue-100 text-blue-800",
  "Crime Scene Investigation": "bg-orange-100 text-orange-800",
  "Forensic Anthropology": "bg-rose-100 text-rose-800",
  "Document Examination": "bg-teal-100 text-teal-800",
  "Ballistics": "bg-gray-100 text-gray-800",
  "Forensic Psychology": "bg-violet-100 text-violet-800",
  "Other": "bg-slate-100 text-slate-700",
};

function NoteCard({ note, index }: { note: Note; index: number }) {
  const badgeColor = SUBJECT_COLORS[note.subject] ?? "bg-cyan-100 text-cyan-800";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
          <FileText className="w-5 h-5 text-blue-700" />
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
          {note.subject}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-blue-800 transition-colors">
          {note.title}
        </h3>
        {note.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{note.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {note.semester && (
          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
            {note.semester}
          </span>
        )}
        {note.course && (
          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
            {note.course}
          </span>
        )}
        {note.tags?.map(tag => (
          <span key={tag} className="text-xs px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full">
            #{tag}
          </span>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {new Date(note.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <a
          href={note.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>
    </motion.div>
  );
}

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [semester, setSemester] = useState("All Semesters");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const supabase = getSupabase();
        const { data, error: err } = await supabase
          .from("notes")
          .select("*")
          .order("created_at", { ascending: false });
        if (err) throw err;
        setNotes(data ?? []);
      } catch (e) {
        setError("Could not load notes. Please try again later.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, []);

  const filtered = notes.filter(n => {
    const matchSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.toLowerCase().includes(search.toLowerCase()) ||
      n.description?.toLowerCase().includes(search.toLowerCase()) ||
      n.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchSubject = subject === "All Subjects" || n.subject === subject;
    const matchSemester = semester === "All Semesters" || n.semester === semester;
    return matchSearch && matchSubject && matchSemester;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <Link href="/">
            <img src="/logo.png" alt="Evidentia" className="object-contain cursor-pointer" style={{ width: "140px" }} />
          </Link>
          <Link
            href="/submit-syllabus"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors hidden sm:block"
          >
            Submit Syllabus →
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Forensic Study Resources
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Forensic Science Notes
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Curated notes crafted for B.Sc and M.Sc forensic science students. Download, study, and ace your exams.
          </p>
        </motion.div>

        {/* Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 space-y-3"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes by title, subject, or tag…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-700 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                showFilters ? "bg-blue-800 text-white border-blue-800" : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-700"
                >
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Semester</label>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-700"
                >
                  {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {(subject !== "All Subjects" || semester !== "All Semesters") && (
                <button
                  onClick={() => { setSubject("All Subjects"); setSemester("All Semesters"); }}
                  className="self-end text-xs text-red-500 hover:text-red-700 transition-colors px-3 py-2"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            Loading notes…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Notes coming soon</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
              We're preparing high-quality forensic science notes. Join the early access list to be notified first.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors"
            >
              Get Early Access
            </Link>
          </motion.div>
        )}

        {!loading && !error && notes.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No notes match your search. Try different keywords or filters.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4">{filtered.length} note{filtered.length !== 1 ? "s" : ""} found</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((note, i) => (
                <NoteCard key={note.id} note={note} index={i} />
              ))}
            </div>
          </>
        )}

        {/* CTA Footer */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mt-16 bg-blue-800 rounded-2xl p-8 text-center text-white"
          >
            <h3 className="text-xl font-bold mb-2">Want notes for your syllabus?</h3>
            <p className="text-blue-200 text-sm mb-5">
              Submit your college syllabus and we'll build notes around your exact curriculum.
            </p>
            <Link
              href="/submit-syllabus"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-800 text-sm font-bold hover:bg-blue-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Submit Your Syllabus
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
