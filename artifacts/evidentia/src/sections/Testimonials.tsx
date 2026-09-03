import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { getSupabase } from "../lib/supabase";

type Testimonial = {
  id: string;
  display_name: string;
  rating: number;
  content: string;
  created_at: string;
};

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const supabase = getSupabase();

        const { data, error } = await supabase
          .from("testimonials")
          .select("id, display_name, rating, content, created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load testimonials:", error);
          return;
        }

        setTestimonials(data ?? []);
      } catch (error) {
        console.error("Testimonials error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, []);

  if (loading) {
    return null;
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">

        {/* Section heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-3">
            Student Experiences
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            What students say about Evidentia
          </h2>

          <p className="mt-4 text-gray-500 leading-relaxed">
            Real experiences from students using Evidentia for their
            forensic science studies.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Quote icon */}
              <div className="absolute top-5 right-5">
                <Quote className="w-7 h-7 text-blue-100 fill-blue-50" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`w-4 h-4 ${
                      index < testimonial.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Testimonial */}
              <p className="text-gray-700 text-sm leading-7 mb-6">
                “{testimonial.content}”
              </p>

              {/* Student */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  {testimonial.display_name}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Evidentia Student
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}