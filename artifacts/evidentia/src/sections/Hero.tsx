import { motion } from "framer-motion";
import { EmailForm } from "../components/EmailForm";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut", delay },
});

export function Hero() {
  return (
    <section className="relative pt-16 pb-16 lg:pt-28 lg:pb-28 overflow-hidden bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.h1
          {...fadeUp(0)}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight"
        >
          Forensic Science Notes, <br className="hidden sm:block" />
          <span className="text-blue-800">Done Right.</span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.15)}
          className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Subject-wise, year-wise, exam-focused notes designed for clarity and results.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="max-w-md mx-auto mb-6">
          <EmailForm buttonText="Get Early Access" />
        </motion.div>

        <motion.p {...fadeUp(0.42)} className="text-sm text-gray-500">
          Be the first to access notes and early discounts.
        </motion.p>
      </div>
    </section>
  );
}
