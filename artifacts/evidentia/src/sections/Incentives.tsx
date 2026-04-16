import { CheckCircle2 } from "lucide-react";

export function Incentives() {
  const benefits = [
    "Early access to all notes",
    "Special launch pricing",
    "Free sample notes"
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why join the waitlist?</h2>
            <ul className="space-y-4">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-4 text-lg text-gray-700">
                  <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}