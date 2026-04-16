import { EmailForm } from "../components/EmailForm";

export function FinalCTA() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Join Before We Launch</h2>
        <div className="max-w-md mx-auto">
          <EmailForm buttonText="Notify Me" />
        </div>
      </div>
    </section>
  );
}