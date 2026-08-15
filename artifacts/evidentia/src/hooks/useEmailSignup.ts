import { useState } from 'react';
import { getSupabase } from '../lib/supabase';

export type SignupStatus = 'idle' | 'loading' | 'success' | 'error';

export function useEmailSignup() {
  const [status, setStatus] = useState<SignupStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitEmail = async (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      // 1. Save the email in Supabase
      const { error: supabaseError } = await getSupabase()
        .from('early_access')
        .insert([{ email }]);

      // Ignore duplicate-email errors, but stop for other Supabase errors.
      if (
        supabaseError &&
        supabaseError.code !== '23505' &&
        !supabaseError.message?.includes('duplicate key') &&
        !supabaseError.message?.includes('unique constraint')
      ) {
        throw supabaseError;
      }

      // 2. Ask Netlify Function to send the sample PDF
      const response = await fetch('/.netlify/functions/send-sample-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Sample PDF email failed:', result);
        
        // The Supabase signup succeeded even if email sending failed.
        setStatus('success');
        return;
      }

      // 3. Everything succeeded
      setStatus('success');
    } catch (err: any) {
      console.error('Signup error:', err);

      const msg = err?.message ?? '';

      if (msg.includes('supabaseUrl') || msg.includes('environment')) {
        setStatus('error');
        setErrorMessage(
          'Sign-ups are not available yet. Check back soon.'
        );
      } else {
        setStatus('error');
        setErrorMessage(
          msg || 'Something went wrong. Please try again.'
        );
      }
    }
  };

  return { status, submitEmail, errorMessage };
}