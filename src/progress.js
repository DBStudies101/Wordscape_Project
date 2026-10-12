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
    .select('current_level, level_id, seed, found_words, bonus_words')
    .maybeSingle(); // null for a brand-new player instead of an error
  if (error) throw error;
  return data;
}

// `state` is Game.state: { levelId, seed, found, bonus, number }
export async function saveProgress(state) {
  const session = await ensureSession();
  const { error } = await supabase.from('player_progress').upsert({
    user_id: session.user.id,
    current_level: state.number,
    level_id: state.levelId,
    seed: state.seed,
    found_words: state.found,
    bonus_words: state.bonus,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
