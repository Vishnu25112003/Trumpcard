const {
  STAT_ORDER,
  shuffleArray,
  distributeCards,
  pickRandomPlayer,
  generateRoomCode,
  redistributeCards,
  resolveRound,
  getNextActiveTurn,
} = require('../utils/gameHelpers');

// ─── shuffleArray ──────────────────────────────────────────────────────────────

describe('shuffleArray', () => {
  test('returns same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr).sort()).toEqual([...arr].sort());
  });

  test('does not mutate original', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  test('returns new array reference', () => {
    const arr = [1, 2, 3];
    expect(shuffleArray(arr)).not.toBe(arr);
  });

  test('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  test('handles single element', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

// ─── distributeCards ──────────────────────────────────────────────────────────

describe('distributeCards', () => {
  const makeCards = (n) => Array.from({ length: n }, (_, i) => `card${i}`);

  test('distributes correct number of hands', () => {
    const hands = distributeCards(makeCards(20), 2, 10);
    expect(hands).toHaveLength(2);
  });

  test('each hand has the correct card count', () => {
    const hands = distributeCards(makeCards(20), 2, 10);
    hands.forEach((h) => expect(h).toHaveLength(10));
  });

  test('no card appears in more than one hand', () => {
    const hands = distributeCards(makeCards(26), 2, 13);
    const all = hands.flat();
    const unique = new Set(all);
    expect(unique.size).toBe(all.length);
  });

  test('remainder cards are dropped (not given to any player)', () => {
    // 52 cards, 3 players × 10 = 30 used, 22 dropped
    const hands = distributeCards(makeCards(52), 3, 10);
    expect(hands.flat()).toHaveLength(30);
  });

  test('works for 4 players', () => {
    const hands = distributeCards(makeCards(52), 4, 13);
    expect(hands).toHaveLength(4);
    hands.forEach((h) => expect(h).toHaveLength(13));
    const unique = new Set(hands.flat());
    expect(unique.size).toBe(52);
  });
});

// ─── generateRoomCode ─────────────────────────────────────────────────────────

describe('generateRoomCode', () => {
  test('matches ANIME-XXXX format', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^ANIME-[A-Z0-9]{4}$/);
  });

  test('never contains O or 0', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[O0]/);
    }
  });

  test('produces different codes on successive calls (probabilistic)', () => {
    const codes = new Set(Array.from({ length: 20 }, generateRoomCode));
    expect(codes.size).toBeGreaterThan(1);
  });
});

// ─── pickRandomPlayer ─────────────────────────────────────────────────────────

describe('pickRandomPlayer', () => {
  const p = (name, elim = false) => ({ name, isEliminated: elim });

  test('returns a non-eliminated player name', () => {
    const players = [p('Alice'), p('Bob'), p('Carol', true)];
    const result = pickRandomPlayer(players);
    expect(['Alice', 'Bob']).toContain(result);
  });

  test('returns empty string when all eliminated', () => {
    expect(pickRandomPlayer([p('X', true), p('Y', true)])).toBe('');
  });

  test('returns the only active player', () => {
    const players = [p('Solo'), p('Out', true)];
    expect(pickRandomPlayer(players)).toBe('Solo');
  });
});

// ─── redistributeCards ────────────────────────────────────────────────────────

describe('redistributeCards', () => {
  const mkPlayer = (name, cards, elim = false) => ({ name, cards: [...cards], cardCount: cards.length, isEliminated: elim });

  test('moves all cards from eliminated player to active players', () => {
    const elim   = mkPlayer('Elim', ['c1', 'c2', 'c3']);
    const active = [mkPlayer('A', []), mkPlayer('B', [])];
    redistributeCards(elim, active);
    expect(elim.cards).toHaveLength(0);
    expect(elim.cardCount).toBe(0);
    expect(active[0].cards.length + active[1].cards.length).toBe(3);
  });

  test('distributes round-robin across active players', () => {
    const elim   = mkPlayer('Elim', ['c1', 'c2', 'c3', 'c4']);
    const active = [mkPlayer('A', []), mkPlayer('B', [])];
    redistributeCards(elim, active);
    // 4 cards split 2–2 (round-robin)
    expect(active[0].cards).toHaveLength(2);
    expect(active[1].cards).toHaveLength(2);
  });

  test('updates cardCount for each active player', () => {
    const elim   = mkPlayer('Elim', ['c1', 'c2']);
    const active = [mkPlayer('A', ['existing'])];
    redistributeCards(elim, active);
    expect(active[0].cardCount).toBe(active[0].cards.length);
  });

  test('does nothing when active players list is empty', () => {
    const elim = mkPlayer('Elim', ['c1', 'c2']);
    redistributeCards(elim, []);
    expect(elim.cards).toHaveLength(2);
  });

  test('does nothing when eliminated player has no cards', () => {
    const elim   = mkPlayer('Elim', []);
    const active = [mkPlayer('A', [])];
    redistributeCards(elim, active);
    expect(active[0].cards).toHaveLength(0);
  });
});

// ─── resolveRound ─────────────────────────────────────────────────────────────

const mkCard = (stats) => ({ stats });
const mkTopCard = (playerName, stats) => ({ playerName, card: mkCard(stats) });

const ALL_MAX  = { power:100, speed:100, intelligence:100, strength:100, defense:100, popularity:100 };
const ALL_MIN  = { power:1,   speed:1,   intelligence:1,   strength:1,   defense:1,   popularity:1   };

describe('resolveRound — clear winner', () => {
  test('winner determined on chosen stat with no tie', () => {
    const cards = [
      mkTopCard('Alice', { power:80, speed:60, intelligence:50, strength:55, defense:45, popularity:70 }),
      mkTopCard('Bob',   { power:60, speed:80, intelligence:50, strength:55, defense:45, popularity:70 }),
    ];
    const result = resolveRound(cards, 'power');
    expect(result.winner).toBe('Alice');
    expect(result.decidingStat).toBe('power');
    expect(result.isDraw).toBe(false);
    expect(result.tieChain).toHaveLength(0);
  });

  test('winner on speed when power ties', () => {
    const cards = [
      mkTopCard('Alice', { power:80, speed:90, intelligence:50, strength:55, defense:45, popularity:70 }),
      mkTopCard('Bob',   { power:80, speed:70, intelligence:50, strength:55, defense:45, popularity:70 }),
    ];
    const result = resolveRound(cards, 'power');
    expect(result.winner).toBe('Alice');
    expect(result.decidingStat).toBe('speed');
    expect(result.tieChain).toEqual(['power']);
    expect(result.isDraw).toBe(false);
  });

  test('tieChain accumulates multiple tied stats before deciding', () => {
    const cards = [
      mkTopCard('A', { power:80, speed:80, intelligence:90, strength:50, defense:50, popularity:50 }),
      mkTopCard('B', { power:80, speed:80, intelligence:70, strength:50, defense:50, popularity:50 }),
    ];
    const result = resolveRound(cards, 'power');
    expect(result.tieChain).toEqual(['power', 'speed']);
    expect(result.decidingStat).toBe('intelligence');
    expect(result.winner).toBe('A');
  });
});

describe('resolveRound — full draw', () => {
  test('returns isDraw true when all stats tie', () => {
    const cards = [
      mkTopCard('A', { ...ALL_MAX }),
      mkTopCard('B', { ...ALL_MAX }),
    ];
    const result = resolveRound(cards, 'power');
    expect(result.isDraw).toBe(true);
    expect(result.winner).toBeNull();
    expect(result.tieChain).toHaveLength(STAT_ORDER.length);
  });

  test('draw with three players all identical', () => {
    const cards = [
      mkTopCard('A', { ...ALL_MIN }),
      mkTopCard('B', { ...ALL_MIN }),
      mkTopCard('C', { ...ALL_MIN }),
    ];
    const result = resolveRound(cards, 'intelligence');
    expect(result.isDraw).toBe(true);
  });
});

describe('resolveRound — cyclic wrap-around', () => {
  test('wraps from popularity back to power when starting near end of STAT_ORDER', () => {
    // Start on 'defense' (index 4), tie on defense and popularity, break on power
    const cards = [
      mkTopCard('A', { power:90, speed:50, intelligence:50, strength:50, defense:80, popularity:80 }),
      mkTopCard('B', { power:70, speed:50, intelligence:50, strength:50, defense:80, popularity:80 }),
    ];
    const result = resolveRound(cards, 'defense');
    expect(result.tieChain).toEqual(['defense', 'popularity']);
    expect(result.decidingStat).toBe('power');
    expect(result.winner).toBe('A');
  });

  test('wraps starting from popularity', () => {
    const cards = [
      mkTopCard('A', { power:50, speed:95, intelligence:50, strength:50, defense:50, popularity:80 }),
      mkTopCard('B', { power:50, speed:70, intelligence:50, strength:50, defense:50, popularity:80 }),
    ];
    const result = resolveRound(cards, 'popularity');
    expect(result.tieChain).toContain('popularity');
    expect(result.decidingStat).toBe('speed');
    expect(result.winner).toBe('A');
  });
});

describe('resolveRound — three players', () => {
  test('picks single winner from three', () => {
    const cards = [
      mkTopCard('A', { power:90, speed:50, intelligence:50, strength:50, defense:50, popularity:50 }),
      mkTopCard('B', { power:70, speed:50, intelligence:50, strength:50, defense:50, popularity:50 }),
      mkTopCard('C', { power:60, speed:50, intelligence:50, strength:50, defense:50, popularity:50 }),
    ];
    const result = resolveRound(cards, 'power');
    expect(result.winner).toBe('A');
    expect(result.isDraw).toBe(false);
  });

  test('two tie, third wins on first tie-break', () => {
    const cards = [
      mkTopCard('A', { power:80, speed:90, intelligence:50, strength:50, defense:50, popularity:50 }),
      mkTopCard('B', { power:80, speed:70, intelligence:50, strength:50, defense:50, popularity:50 }),
      mkTopCard('C', { power:60, speed:50, intelligence:50, strength:50, defense:50, popularity:50 }),
    ];
    // A and B tie on power; C is already out of contention for power (60 < 80)
    // On speed A wins
    const result = resolveRound(cards, 'power');
    expect(result.winner).toBe('A');
    expect(result.decidingStat).toBe('speed');
  });
});

// ─── getNextActiveTurn ────────────────────────────────────────────────────────

const mkGs = (turnOrder, players) => ({
  turnOrder,
  players: players.map(([name, elim]) => ({ name, isEliminated: elim })),
});

describe('getNextActiveTurn — normal cycle', () => {
  test('returns next player in turnOrder', () => {
    const gs = mkGs(['A', 'B', 'C'], [['A', false], ['B', false], ['C', false]]);
    expect(getNextActiveTurn(gs, 'A')).toBe('B');
    expect(getNextActiveTurn(gs, 'B')).toBe('C');
    expect(getNextActiveTurn(gs, 'C')).toBe('A');
  });

  test('wraps around from last to first', () => {
    const gs = mkGs(['A', 'B', 'C'], [['A', false], ['B', false], ['C', false]]);
    expect(getNextActiveTurn(gs, 'C')).toBe('A');
  });
});

describe('getNextActiveTurn — skip eliminated', () => {
  test('skips one eliminated player', () => {
    const gs = mkGs(['A', 'B', 'C'], [['A', false], ['B', true], ['C', false]]);
    expect(getNextActiveTurn(gs, 'A')).toBe('C');
  });

  test('skips multiple consecutive eliminated players', () => {
    const gs = mkGs(['A', 'B', 'C', 'D'], [['A', false], ['B', true], ['C', true], ['D', false]]);
    expect(getNextActiveTurn(gs, 'A')).toBe('D');
  });

  test('wraps and skips eliminated when cycling back', () => {
    const gs = mkGs(['A', 'B', 'C'], [['A', true], ['B', false], ['C', false]]);
    // C → next in order is A (eliminated) → skip to B
    expect(getNextActiveTurn(gs, 'C')).toBe('B');
  });
});

describe('getNextActiveTurn — current player just eliminated', () => {
  test('still advances to correct successor after current player eliminated', () => {
    // B was just eliminated; next should be C, not fallback to A
    const gs = mkGs(['A', 'B', 'C'], [['A', false], ['B', true], ['C', false]]);
    expect(getNextActiveTurn(gs, 'B')).toBe('C');
  });

  test('wraps correctly when last player eliminated', () => {
    const gs = mkGs(['A', 'B', 'C'], [['A', false], ['B', false], ['C', true]]);
    expect(getNextActiveTurn(gs, 'C')).toBe('A');
  });

  test('skips multiple eliminated including current', () => {
    const gs = mkGs(['A', 'B', 'C', 'D'], [['A', false], ['B', true], ['C', true], ['D', false]]);
    expect(getNextActiveTurn(gs, 'B')).toBe('D');
  });
});

describe('getNextActiveTurn — edge cases', () => {
  test('returns null when everyone is eliminated', () => {
    const gs = mkGs(['A', 'B'], [['A', true], ['B', true]]);
    expect(getNextActiveTurn(gs, 'A')).toBeNull();
  });

  test('returns only active player when all others eliminated', () => {
    const gs = mkGs(['A', 'B', 'C'], [['A', false], ['B', true], ['C', true]]);
    expect(getNextActiveTurn(gs, 'B')).toBe('A');
  });

  test('handles name not in turnOrder — returns first active', () => {
    const gs = mkGs(['A', 'B', 'C'], [['A', false], ['B', false], ['C', false]]);
    expect(getNextActiveTurn(gs, 'UNKNOWN')).toBe('A');
  });
});
