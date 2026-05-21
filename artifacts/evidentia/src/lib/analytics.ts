import { getSupabase } from './supabase';

export async function trackPageView(page: string) {
  try {
    const supabase = getSupabase();
    await supabase.from('page_views').insert({
      page,
      referrer: document.referrer || null,
    });
  } catch {
    // Silent fail — analytics must never break the app
  }
}
