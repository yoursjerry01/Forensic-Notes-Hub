import { motion } from "framer-motion";
import { BookOpen, Calendar, FileText, Download } from "lucide-react";

const features = [
  {
    title: "Subject-wise organization",
    icon: <BookOpen className="w-6 h-6 text-teal-700" />,
    description: "Navigate seamlessly through distinct forensic disciplines.",
  },
  {
    title: "Year & semester-wise notes",
    icon: <Calendar className="w-6 h-6 text-teal-700" />,
    description: "Structured exactly like your academic curriculum.",
  },
  {
    title: "Detailed + Short notes",
    icon: <FileText className="w-6 h-6 text-teal-700" />,
    description: "In-depth explanations paired with rapid-revision summaries.",
  },
  {
    title: "Instant downloadable PDFs",
    icon: <Download className="w-6 h-6 text-teal-700" />,
    description: "Access your materials offline, anywhere, anytime.",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-teal-50 rounded-xl mb-6">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
