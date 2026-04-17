import { Link } from "wouter";
import { motion } from "framer-motion";
import { FileUp } from "lucide-react";

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

        <Link
          href="/submit-syllabus"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors shadow-sm"
        >
          <FileUp className="w-4 h-4" />
          Submit Your Syllabus
        </Link>
      </div>
    </motion.header>
  );
}
