import { EmailForm } from "../components/EmailForm";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          Forensic Science Notes, <br className="hidden sm:block" />
          <span className="text-teal-700">Done Right.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Subject-wise, year-wise, exam-focused notes designed for clarity and results.
        </p>
        
        <div className="max-w-md mx-auto mb-6">
          <EmailForm buttonText="Get Early Access" />
        </div>
        
        <p className="text-sm text-gray-500">
          Be the first to access notes and early discounts.
        </p>
      </div>
    </section>
  );
}