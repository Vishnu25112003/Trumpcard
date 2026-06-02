const RANKED_CHARACTERS = [
  { key: 'raja', label: 'Raja', title: 'King', score: 1000 },
  { key: 'rani', label: 'Rani', title: 'Queen', score: 800 },
  { key: 'mandhiri', label: 'Mandhiri', title: 'Minister', score: 600 },
  { key: 'senapathi', label: 'Senapathi', title: 'Commander', score: 500 },
  { key: 'sipahi', label: 'Sipahi', title: 'Soldier', score: 400 },
  { key: 'vaidyar', label: 'Vaidyar', title: 'Royal Doctor', score: 300 },
  { key: 'purohit', label: 'Purohit', title: 'Priest', score: 200 },
  { key: 'sevakan', label: 'Sevakan', title: 'Servant', score: 100 },
  { key: 'bhikari', label: 'Bhikari', title: 'Beggar', score: 50 },
];

const THIEF = { key: 'thief', label: 'Thief', title: 'Thief', score: 0 };
const ALL_CHARACTERS = [...RANKED_CHARACTERS, THIEF];
const CHARACTER_MAP = Object.fromEntries(ALL_CHARACTERS.map((c) => [c.key, c]));

function selectCharacters(playerCount) {
  if (playerCount < 4 || playerCount > 10) {
    throw new Error('Raja Rani supports 4 to 10 players');
  }
  return [...RANKED_CHARACTERS.slice(0, playerCount - 1), THIEF];
}

function scoreOf(key) {
  return CHARACTER_MAP[key]?.score ?? 0;
}

function characterOf(key) {
  return CHARACTER_MAP[key] || null;
}

module.exports = {
  ALL_CHARACTERS,
  CHARACTER_MAP,
  RANKED_CHARACTERS,
  THIEF,
  selectCharacters,
  scoreOf,
  characterOf,
};
