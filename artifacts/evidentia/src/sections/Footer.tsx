import { motion } from "framer-motion";

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
        <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Evidentia</h3>
        <p className="text-gray-500 mb-6">Making forensic science simple and structured.</p>
        <p className="text-sm text-gray-400">
          Copyright &copy; 2026 Evidentia. All rights reserved.
        </p>
      </motion.div>
    </footer>
  );
}
