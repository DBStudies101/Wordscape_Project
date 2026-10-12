// Built-in levels, used only if the database can't be reached.
// Same shape as the database levels: ids match the first two rows seeded in Supabase.
export const LEVELS = [
  {
    id: 1,
    letters: ['H', 'E', 'A', 'R', 'T'],
    pool: ['HEART', 'EARTH', 'HATER', 'HEAR', 'HATE', 'HEAT', 'TEAR', 'RATE', 'HAT', 'EAT', 'TEA', 'ART', 'RAT', 'EAR', 'ARE', 'ATE', 'TAR', 'ERA'],
  },
  {
    id: 2,
    letters: ['C', 'L', 'O', 'U', 'D'],
    pool: ['CLOUD', 'COULD', 'LOUD', 'OLD', 'COD', 'CLOD', 'COLD', 'DUO'],
  },
];
