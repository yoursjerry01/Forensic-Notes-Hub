import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Users, Mail, FileText, Eye, ArrowLeft, Lock,
  Upload, Trash2, BookOpen, X, AlertCircle, CheckCircle, Plus
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

const ADMIN_PASSWORD = "Anckit@0809";

type DayCount = { date: string; views: number };
type Signup = { email: string; created_at: string };
type Submission = { name: string; email: string; course: string; college: string; created_at: string };
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

const SUBJECTS = [
  "Forensic Chemistry", "Forensic Toxicology", "Forensic Biology",
  "DNA Analysis", "Forensic Physics", "Crime Scene Investigation",
  "Forensic Anthropology", "Document Examination", "Ballistics",
  "Forensic Psychology", "Other",
];
const ALLOWED_TYPES = ["application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];
const MAX_MB = 50;

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { onLogin(); }
    else setErr(true);
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Evidentia" className="mx-auto object-contain mb-4" style={{ width: "160px" }} />
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Enter admin password</span>
          </div>
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-700 mb-3"
            autoFocus
          />
          {err && <p className="text-xs text-red-500 mb-3">Incorrect password.</p>}
          <button type="submit" className="w-full py-2.5 rounded-lg bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors">
            Sign In
          </button>
        </form>
        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-blue-700 transition-colors">← Back to site</Link>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [totalSignups, setTotalSignups] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [chartData, setChartData] = useState<DayCount[]>([]);
  const [recentSignups, setRecentSignups] = useState<Signup[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    async function fetchAll() {
      try {
        const supabase = getSupabase();
        const { count: viewCount } = await supabase.from("page_views").select("*", { count: "exact", head: true });
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString());
        const { count: signupCount } = await supabase.from("early_access").select("*", { count: "exact", head: true });
        const { count: submissionCount } = await supabase.from("syllabus_submissions").select("*", { count: "exact", head: true });
        const days: DayCount[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
          const end = new Date(d); end.setDate(end.getDate() + 1);
          const { count } = await supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", d.toISOString()).lt("created_at", end.toISOString());
          days.push({ date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }), views: count ?? 0 });
        }
        const { data: signups } = await supabase.from("early_access").select("email, created_at").order("created_at", { ascending: false }).limit(10);
        const { data: submissions } = await supabase.from("syllabus_submissions").select("name, email, course, college, created_at").order("created_at", { ascending: false }).limit(10);
        setTotalViews(viewCount ?? 0); setTodayViews(todayCount ?? 0);
        setTotalSignups(signupCount ?? 0); setTotalSubmissions(submissionCount ?? 0);
        setChartData(days); setRecentSignups(signups ?? []); setRecentSubmissions(submissions ?? []);
      } catch (e) {
        setFetchError("Could not load analytics. Check Supabase RLS policies.");
      } finally { setLoading(false); }
    }
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
      <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> Loading analytics…
    </div>
  );
  if (fetchError) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{fetchError}</div>;

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Eye className="w-5 h-5 text-blue-700" />} label="Total Page Views" value={totalViews} color="bg-blue-50" />
        <StatCard icon={<Eye className="w-5 h-5 text-cyan-600" />} label="Views Today" value={todayViews} color="bg-cyan-50" />
        <StatCard icon={<Mail className="w-5 h-5 text-purple-600" />} label="Email Signups" value={totalSignups} color="bg-purple-50" />
        <StatCard icon={<FileText className="w-5 h-5 text-emerald-600" />} label="Syllabus Submitted" value={totalSubmissions} color="bg-emerald-50" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-6">Page Views — Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} cursor={{ fill: "#f3f4f6" }} />
            <Bar dataKey="views" fill="#1e40af" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-700">Recent Email Signups</h3>
            <span className="ml-auto text-xs text-gray-400">{totalSignups} total</span>
          </div>
          {recentSignups.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No signups yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSignups.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-800 truncate max-w-[200px]">{s.email}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-700">Recent Syllabus Submissions</h3>
            <span className="ml-auto text-xs text-gray-400">{totalSubmissions} total</span>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSubmissions.map((s, i) => (
                <div key={i} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.course} · {s.college}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notesError, setNotesError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [noteType, setNoteType] = useState("");
const [course, setCourse] = useState("");
const [tagsInput, setTagsInput] = useState("");
const [isFree, setIsFree] = useState(true);
const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchNotes() {
    setLoadingNotes(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setNotes(data ?? []);
    } catch (e) {
      setNotesError("Could not load notes.");
    } finally { setLoadingNotes(false); }
  }

  useEffect(() => { fetchNotes(); }, []);

  function handleFile(f: File | null) {
    setFileError("");
    if (!f) { setFile(null); return; }
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXT.some(e => f.name.toLowerCase().endsWith(e))) {
      setFileError("Use PDF, DOC, or DOCX only."); return;
    }
    if (f.size > MAX_MB * 1024 * 1024) { setFileError(`Max file size is ${MAX_MB}MB.`); return; }
    setFile(f);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subject || !noteType) {
  setUploadMsg("Title, subject, and note type are required.");
  setUploadStatus("error");
  return;
}

if (!isFree) {
  const numericPrice = Number(price);

  if (!price || !Number.isFinite(numericPrice) || numericPrice <= 0) {
    setUploadMsg("Please enter a valid price for a paid note.");
    setUploadStatus("error");
    return;
  }
}
    if (!file) { setUploadMsg("Please select a file."); setUploadStatus("error"); return; }

    setUploadStatus("loading"); setUploadMsg("");
    try {
      const supabase = getSupabase();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${Date.now()}_${safeName}`;

      const { error: storageErr } = await supabase.storage.from("notes_files").upload(path, file, { upsert: false });
      if (storageErr) throw new Error(`Upload failed: ${storageErr.message}`);

      const { data: urlData } = supabase.storage.from("notes_files").getPublicUrl(path);
      const fileUrl = urlData?.publicUrl;
      if (!fileUrl) throw new Error("Could not get public URL.");

      const tags = tagsInput.trim() ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : null;

      const { error: dbErr } = await supabase.from("notes").insert({
        title: title.trim(),
subject,
description: description.trim() || null,
note_type: noteType,
course: course.trim() || null,
file_url: fileUrl,
file_name: file.name,
tags,
is_free: isFree,
price: isFree ? null : Number(price),
      });
      if (dbErr) throw new Error(`DB error: ${dbErr.message}`);

      setUploadStatus("success"); setUploadMsg("Note uploaded successfully!");
      setTitle("");
setSubject("");
setDescription("");
setNoteType("");
setCourse("");
setTagsInput("");
setIsFree(true);
setPrice("");
setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await fetchNotes();
      setTimeout(() => { setUploadStatus("idle"); setUploadMsg(""); setShowUpload(false); }, 1800);
    } catch (err: unknown) {
      setUploadStatus("error");
      setUploadMsg(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function handleDelete(note: Note) {
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    try {
      const supabase = getSupabase();
      const pathPart = note.file_url.split("/notes_files/")[1];
      if (pathPart) await supabase.storage.from("notes_files").remove([pathPart]);
      await supabase.from("notes").delete().eq("id", note.id);
      setNotes(prev => prev.filter(n => n.id !== note.id));
    } catch (e) {
      alert("Failed to delete note.");
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-700 transition-colors";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900">Notes Manager</h2>
          <p className="text-xs text-gray-400 mt-0.5">{notes.length} note{notes.length !== 1 ? "s" : ""} published</p>
        </div>
        <button
          onClick={() => setShowUpload(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors"
        >
          {showUpload ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Upload Note</>}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" /> Upload New Note
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Title <span className="text-red-400">*</span></label>
                <input className={inputClass} placeholder="e.g. Forensic Toxicology Unit 2" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Subject <span className="text-red-400">*</span></label>
                <select className={inputClass} value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Brief description of what's covered…" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
  <div>
    <label className={labelClass}>
      Note Type <span className="text-red-400">*</span>
    </label>

    <select
      className={inputClass}
      value={noteType}
      onChange={e => setNoteType(e.target.value)}
    >
      <option value="">Select note type</option>
      <option value="Detailed Notes">Detailed Notes</option>
      <option value="Revision Notes">Revision Notes</option>
    </select>
  </div>

  <div>
    <label className={labelClass}>Course</label>

    <input
      className={inputClass}
      placeholder="e.g. B.Sc Forensic Science"
      value={course}
      onChange={e => setCourse(e.target.value)}
    />
  </div>
</div>

            <div>
              <label className={labelClass}>Tags <span className="font-normal text-gray-400">(comma-separated)</span></label>
              <input className={inputClass} placeholder="e.g. toxicology, poisons, unit-2" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>File <span className="text-red-400">*</span></label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
                className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-colors ${file ? "border-cyan-400 bg-blue-50/40" : "border-gray-200 bg-gray-50 hover:border-cyan-400"}`}
              >
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{file.name}</span>
                    <button type="button" onClick={ev => { ev.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="p-1 rounded-full hover:bg-gray-200">
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                    <p className="text-sm text-gray-500"><span className="text-blue-700 font-medium">Click to upload</span> or drag & drop</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX — max {MAX_MB}MB</p>
                  </div>
                )}
              </div>
              {fileError && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileError}</p>}
            </div>

            <div className="space-y-3">
  <label className={labelClass}>
    Access <span className="text-red-400">*</span>
  </label>

  <div className="flex flex-wrap gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="note-access"
        checked={isFree}
        onChange={() => setIsFree(true)}
        className="accent-blue-800"
      />
      <span className="text-sm text-gray-700">Free</span>
    </label>

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="note-access"
        checked={!isFree}
        onChange={() => setIsFree(false)}
        className="accent-blue-800"
      />
      <span className="text-sm text-gray-700">Paid</span>
    </label>
  </div>

  {!isFree && (
    <div>
      <label className={labelClass}>
        Price (₹) <span className="text-red-400">*</span>
      </label>

      <input
        type="number"
        min="1"
        step="1"
        className={inputClass}
        placeholder="e.g. 49"
        value={price}
        onChange={e => setPrice(e.target.value)}
      />

      <p className="text-xs text-gray-400 mt-1">
        Enter the selling price in Indian Rupees.
      </p>
    </div>
  )}
</div>

{uploadMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${uploadStatus === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                {uploadStatus === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {uploadMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={uploadStatus === "loading"}
              className="w-full py-2.5 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadStatus === "loading" ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
              ) : "Publish Note"}
            </button>
          </form>
        </div>
      )}

      {/* Notes List */}
      {loadingNotes ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> Loading…
        </div>
      ) : notesError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{notesError}</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-blue-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No notes yet</p>
          <p className="text-gray-400 text-xs mt-1">Upload your first note above.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Subject</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">
  Type
</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Added</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[200px] truncate">{n.title}</td>
                  <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{n.subject}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs hidden lg:table-cell">
  {n.note_type ?? "—"}
</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs hidden sm:table-cell">
                    {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={n.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-700 font-semibold hover:text-blue-900 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(n)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("ev_admin") === "1");
  const [tab, setTab] = useState<"analytics" | "notes">("analytics");

  function handleLogin() { sessionStorage.setItem("ev_admin", "1"); setAuthed(true); }
  function handleLogout() { sessionStorage.removeItem("ev_admin"); setAuthed(false); }

  if (!authed) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <span className="text-gray-300">|</span>
            <img src="/logo.png" alt="Evidentia" className="object-contain" style={{ width: "120px" }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">Admin Dashboard</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-6xl mx-auto flex gap-1">
          {([
            { id: "analytics", label: "Analytics", icon: <Eye className="w-3.5 h-3.5" /> },
            { id: "notes", label: "Notes Manager", icon: <BookOpen className="w-3.5 h-3.5" /> },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "notes" && <NotesTab />}
      </div>
    </div>
  );
}
