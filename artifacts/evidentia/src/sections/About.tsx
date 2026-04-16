import { motion } from "framer-motion";

export function About() {
  return (
    <section className="py-20 bg-gray-50 border-y border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Evidence. Explained.</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Evidentia provides structured forensic science notes categorized by subject, semester, and exam relevance. We distill complex scholarly material into clear, precise study resources.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
