const BASE = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_KEY;

// Database row -> level object the game uses.
// The database stores facts (letters + words); the generator decides the layout.
function toLevel(row) {
  return {
    id: row.id,
    letters: row.letters.split(''),
    pool: row.level_words.map((w) => w.word),
    gridPool: row.level_words.filter((w) => w.on_grid).map((w) => w.word),
  };
}

export async function fetchLevels() {
  const res = await fetch(
    `${BASE}/rest/v1/levels?select=id,letters,level_words(word,on_grid)&order=id`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
  );
  if (!res.ok) throw new Error(`Supabase request failed: ${res.status}`);

  const rows = await res.json();
  if (rows.length === 0) throw new Error('No levels returned');
  return rows.map(toLevel);
}
