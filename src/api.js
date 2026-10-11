   import { generate } from './generator.js';
const BASE = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_KEY;

   // Build a level from a DB row: the DB gives letters and a word pool,
   // and the generator decides where the words go
   function toLevel(row) {
     const pool = row.level_words.map((w) => w.word);
     const layout = generate(pool, { maxWords: 6 });
     const placed = new Set(layout.words.map((p) => p.word));
     return {
       letters: row.letters.split(''),
       words: layout.words,
       bonus: pool.filter((w) => !placed.has(w)),
     };
   }
export async function fetchLevels() {
  const res = await fetch(
    `${BASE}/rest/v1/levels?select=id,letters,level_words(*)&order=id`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
  );
  if (!res.ok) throw new Error(`Supabase request failed: ${res.status}`);

  const rows = await res.json();
  if (rows.length === 0) throw new Error('No levels returned');
  return rows.map(toLevel);
}
