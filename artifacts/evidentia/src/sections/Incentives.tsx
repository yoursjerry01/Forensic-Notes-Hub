import { motion } from "framer-motion";
import { Zap, Tag, BookOpenCheck } from "lucide-react";

const benefits = [
  {
    icon: <Zap className="w-7 h-7 text-cyan-400" />,
    number: "01",
    title: "Early Access",
    description: "Get full access to all notes before anyone else — before the public launch.",
  },
  {
    icon: <Tag className="w-7 h-7 text-cyan-400" />,
    number: "02",
    title: "Launch Pricing",
    description: "Lock in the lowest price we'll ever offer. Early supporters get the best deal.",
  },
  {
    icon: <BookOpenCheck className="w-7 h-7 text-cyan-400" />,
    number: "03",
    title: "Free Sample Notes",
    description: "Download free sample notes immediately after joining the waitlist.",
  },
];

export function Incentives() {
  return (
    <section className="py-24 bg-gray-950 text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-cyan-400 mb-4">
            Why Join Early
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            The waitlist has its perks.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.12 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 overflow-hidden cursor-default"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-cyan-500/5" />

              <span className="absolute top-4 right-6 text-7xl font-black text-white/5 select-none leading-none">
                {b.number}
              </span>

              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
                {b.icon}
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{b.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{b.description}</p>

              <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 rounded-b-2xl" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
