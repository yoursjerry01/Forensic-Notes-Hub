import { motion } from "framer-motion";
import { Mail, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 bg-gray-50 border-t border-gray-200 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="container mx-auto px-4"
      >
        <p className="text-gray-500 mb-6 text-sm">Making forensic science simple and structured.</p>

        <div className="flex items-center justify-center gap-4 mb-8">
          <a
            href="mailto:Contact@evidentia.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-blue-500 hover:text-blue-800 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact@evidentia.com
          </a>
          <a
            href="https://instagram.com/evidentia.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-pink-400 hover:text-pink-600 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            @evidentia.in
          </a>
        </div>

        <p className="text-sm text-gray-400">
          Copyright &copy; 2026 Evidentia. All rights reserved.
        </p>
      </motion.div>
    </footer>
  );
}
