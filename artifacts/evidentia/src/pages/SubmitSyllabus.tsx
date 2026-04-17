import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, AlertCircle, FileText, X, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { getSupabase } from "../lib/supabase";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
const MAX_SIZE_MB = 25;

const SEMESTERS = [
  "Year 1 / Sem 1",
  "Year 1 / Sem 2",
  "Year 2 / Sem 3",
  "Year 2 / Sem 4",
  "Year 3 / Sem 5",
  "Year 3 / Sem 6",
];

type Status = "idle" | "loading" | "success" | "error";

export function SubmitSyllabus() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [college, setCollege] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    setFileError("");
    if (!f) { setFile(null); return; }
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXT.some(e => f.name.toLowerCase().endsWith(e))) {
      setFileError("Unsupported file type. Use PDF, JPG, PNG, DOC, or DOCX.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File exceeds ${MAX_SIZE_MB}MB limit.`);
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const finalCourse = course === "Other" ? customCourse.trim() : course;
    if (!name.trim() || !email.trim() || !finalCourse || !semester || !college.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!file) {
      setErrorMsg("Please upload a syllabus file.");
      return;
    }

    setStatus("loading");

    try {
      // Step 1: Init client
      const supabase = getSupabase();

      // Step 2: Upload file
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${Date.now()}_${safeName}`;

      console.log("[Evidentia] Uploading file to storage...", storagePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("syllabus_uploads")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        console.error("[Evidentia] Upload failed:", uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
      console.log("[Evidentia] Upload successful:", uploadData);

      // Step 3: Get public URL
      const { data: urlData } = supabase.storage
        .from("syllabus_uploads")
        .getPublicUrl(storagePath);

      const fileUrl = urlData?.publicUrl;
      if (!fileUrl) throw new Error("Could not retrieve file URL after upload.");
      console.log("[Evidentia] Public URL:", fileUrl);

      // Step 4: Insert row into database
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        course: finalCourse,
        semester,
        college: college.trim(),
        subject: subject.trim() || null,
        file_url: fileUrl,
        notes: notes.trim() || null,
      };
      console.log("[Evidentia] Inserting into syllabus_submissions:", payload);

      const { error: dbError } = await supabase
        .from("syllabus_submissions")
        .insert(payload);

      if (dbError) {
        console.error("[Evidentia] DB insert failed:", dbError);
        throw new Error(`Submission failed: ${dbError.message}`);
      }
      console.log("[Evidentia] DB insert successful.");

      setStatus("success");
    } catch (err: unknown) {
      console.error("[Evidentia] Submit error:", err);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-700 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  if (status === "success") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-blue-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Submission received.</h2>
          <p className="text-gray-500 mb-2">
            This helps us create better notes for your curriculum.
          </p>
          <p className="text-sm text-blue-800 font-medium mb-8">
            You'll get early access when notes for your syllabus are available.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Evidentia
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <Link href="/">
            <img src="/logo.png" alt="Evidentia" className="object-contain cursor-pointer" style={{ width: "140px", height: "auto" }} />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-700 mb-3">
            Syllabus Submission
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Submit Your College Syllabus
          </h1>
          <p className="text-gray-500">
            Help us build accurate notes based on your actual curriculum.
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 text-sm text-gray-600 space-y-1.5"
        >
          <p className="font-semibold text-gray-800 mb-2">Before you submit</p>
          {[
            "Upload official syllabus only (college-issued)",
            `Supported formats: PDF, JPG, JPEG, PNG, DOC, DOCX`,
            "File must be clear and readable",
            "One syllabus per submission",
            `Maximum file size: ${MAX_SIZE_MB}MB`,
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
              <span>{item}</span>
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Full Name <span className="text-red-400">*</span></label>
              <input
                className={inputClass}
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={status === "loading"}
              />
            </div>
            <div>
              <label className={labelClass}>Email <span className="text-red-400">*</span></label>
              <input
                type="email"
                className={inputClass}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Course Type <span className="text-red-400">*</span></label>
            <select
              className={inputClass}
              value={course}
              onChange={e => setCourse(e.target.value)}
              disabled={status === "loading"}
            >
              <option value="">Select your course</option>
              <option>B.Sc Forensic Science</option>
              <option>M.Sc Forensic Science</option>
              <option>Other</option>
            </select>
          </div>

          <AnimatePresence>
            {course === "Other" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className={labelClass}>Enter your course name <span className="text-red-400">*</span></label>
                <input
                  className={inputClass}
                  placeholder="e.g. B.Sc Criminalistics"
                  value={customCourse}
                  onChange={e => setCustomCourse(e.target.value)}
                  disabled={status === "loading"}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Year / Semester <span className="text-red-400">*</span></label>
              <select
                className={inputClass}
                value={semester}
                onChange={e => setSemester(e.target.value)}
                disabled={status === "loading"}
              >
                <option value="">Select semester</option>
                {SEMESTERS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>College Name <span className="text-red-400">*</span></label>
              <input
                className={inputClass}
                placeholder="Your college / university"
                value={college}
                onChange={e => setCollege(e.target.value)}
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Subject <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className={inputClass}
              placeholder="e.g. Forensic Toxicology"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={status === "loading"}
            />
          </div>

          {/* File upload */}
          <div>
            <label className={labelClass}>Upload Syllabus <span className="text-red-400">*</span></label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
              className={`relative cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                file ? "border-cyan-400 bg-blue-50/40" : "border-gray-200 bg-gray-50 hover:border-cyan-400 hover:bg-blue-50/30"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => handleFile(e.target.files?.[0] ?? null)}
                disabled={status === "loading"}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-5 h-5 text-blue-700 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{file.name}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="ml-auto p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    <span className="text-blue-700 font-medium">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX — max {MAX_SIZE_MB}MB</p>
                </div>
              )}
            </div>
            {fileError && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {fileError}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Additional Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Anything important about your syllabus..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={status === "loading"}
            />
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-blue-800"
              disabled={status === "loading"}
            />
            <span className="text-sm text-gray-600">
              I confirm this is an official, college-issued syllabus.
            </span>
          </label>

          <p className="text-xs text-blue-800 font-medium">
            Top contributors may get free access to notes.
          </p>

          {errorMsg && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !confirmed}
            className="w-full py-3 rounded-xl bg-blue-800 text-white font-semibold text-sm hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              "Submit Syllabus"
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
