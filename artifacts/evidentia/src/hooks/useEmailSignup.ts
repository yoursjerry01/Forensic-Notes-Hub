import { useState } from 'react';
import { getSupabase } from '../lib/supabase';

export type SignupStatus = 'idle' | 'loading' | 'success' | 'error';

export function useEmailSignup() {
  const [status, setStatus] = useState<SignupStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitEmail = async (email: string) => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const { error } = await getSupabase()
        .from('early_access')
        .insert([{ email }]);

      if (error) {
        throw error;
      }

      setStatus('success');
    } catch (err: any) {
      const msg = err?.message ?? '';
      const code = err?.code ?? '';
      if (msg.includes('supabaseUrl') || msg.includes('environment')) {
        setStatus('error');
        setErrorMessage('Sign-ups are not available yet. Check back soon.');
      } else if (code === '23505' || msg.includes('duplicate key') || msg.includes('unique constraint')) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(msg || 'Something went wrong. Please try again.');
      }
    }
  };

  return { status, submitEmail, errorMessage };
}