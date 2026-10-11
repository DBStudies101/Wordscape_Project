import { supabase } from './supabase.js';

// Reuse the saved session, or create an anonymous one on the first visit
async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function loadProgress() {
  await ensureSession();
  const { data, error } = await supabase
    .from('player_progress')
    .select('current_level')
    .maybeSingle(); // returns null instead of an error for a new player
  if (error) throw error;
  return data;
}

export async function saveProgress(currentLevel) {
  const session = await ensureSession();
  const { error } = await supabase.from('player_progress').upsert({
    user_id: session.user.id,
    current_level: currentLevel,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}