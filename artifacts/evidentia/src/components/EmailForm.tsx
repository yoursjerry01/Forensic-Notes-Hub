import { useState } from 'react';
import { useEmailSignup } from '../hooks/useEmailSignup';

interface EmailFormProps {
  buttonText: string;
}

export function EmailForm({ buttonText }: EmailFormProps) {
  const [email, setEmail] = useState('');
  const { status, submitEmail, errorMessage } = useEmailSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      submitEmail(email);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 p-4 text-blue-800 bg-blue-50 border border-blue-200 rounded-md font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-700"><polyline points="20 6 9 17 4 12"></polyline></svg>
        You're In. We'll notify you soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={status === 'loading'}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="cta-btn whitespace-nowrap"
        >
          {status === 'loading' ? 'Submitting...' : buttonText}
        </button>
      </div>
      {status === 'error' && errorMessage && (
        <p className="mt-2 text-sm text-red-600 text-left">{errorMessage}</p>
      )}
    </form>
  );
}
