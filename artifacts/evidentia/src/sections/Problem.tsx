import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const problems = [
  "Scattered notes waste your time.",
  "Material is incomplete or too complex.",
  "No structure for exam preparation.",
];

const solutions = [
  "Subject & semester-wise organisation.",
  "Clear, distilled, exam-focused content.",
  "Built around how students actually study.",
];

export function Problem() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            The Problem
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            The typical student experience.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Before column */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-2xl bg-gray-50 border border-gray-200 p-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Without Evidentia</p>
            <ul className="space-y-4">
              {problems.map((p, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                  className="flex items-start gap-3 text-gray-500"
                >
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-3 h-3 text-red-500" />
                  </span>
                  <span className="text-sm leading-relaxed line-through decoration-gray-300">{p}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* After column */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
            className="rounded-2xl bg-blue-900 border border-blue-800 p-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">With Evidentia</p>
            <ul className="space-y-4">
              {solutions.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3 text-white"
                >
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-cyan-400" />
                  </span>
                  <span className="text-sm leading-relaxed">{s}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-gray-500 text-sm mt-10"
        >
          Evidentia is built for forensic science students who want to study smarter, not harder.
        </motion.p>
      </div>
    </section>
  );
}
