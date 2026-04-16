import { motion } from "framer-motion";

const lines = [
  { text: "Scattered notes waste your time.", border: true },
  { text: "Most material is incomplete or too complex.", border: true },
  { text: "Evidentia simplifies forensic science into structured notes.", border: false, highlight: true },
];

export function Problem() {
  return (
    <section className="py-24 bg-teal-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold mb-12"
        >
          The typical student experience.
        </motion.h2>

        <div className="space-y-6 text-xl md:text-2xl font-light opacity-90">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.15 }}
              className={[
                line.border ? "border-b border-teal-800 pb-6" : "pt-2",
                line.highlight ? "font-medium text-white" : "",
              ].join(" ")}
            >
              {line.text}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
