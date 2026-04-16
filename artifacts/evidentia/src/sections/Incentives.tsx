import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Early access to all notes",
  "Special launch pricing",
  "Free sample notes",
];

export function Incentives() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why join the waitlist?</h2>
            <ul className="space-y-4">
              {benefits.map((benefit, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 + i * 0.1 }}
                  className="flex items-center gap-4 text-lg text-gray-700"
                >
                  <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
                  <span>{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
