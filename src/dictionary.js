// Set gives O(1) lookups. v2: load a full word list and add a Trie for prefix checks.
export class Dictionary {
  constructor(words) {
    this.words = new Set(words.map((w) => w.toUpperCase()));
  }
  has(word) {
    return this.words.has(word);
  }
}
