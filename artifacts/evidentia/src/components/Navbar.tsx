import { Link } from "wouter";
import { motion } from "framer-motion";
import { FileUp, BookOpen } from "lucide-react";

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl flex items-center justify-between h-16">
        <Link href="/">
          <img
            src="/logo.png"
            alt="Evidentia"
            className="cursor-pointer object-contain"
            style={{ width: "180px", height: "auto" }}
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-blue-200 text-blue-800 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Browse Notes</span>
            <span className="sm:hidden">Notes</span>
          </Link>
          <Link
            href="/submit-syllabus"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors shadow-sm"
          >
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Submit Your Syllabus</span>
            <span className="sm:hidden">Syllabus</span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
