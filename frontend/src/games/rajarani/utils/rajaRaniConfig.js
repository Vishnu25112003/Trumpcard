export const CHARACTERS = {
  raja: { label: 'Raja', title: 'King', score: 1000, icon: '👑', color: 'var(--gold)' },
  rani: { label: 'Rani', title: 'Queen', score: 800, icon: '💎', color: 'var(--pink)' },
  mandhiri: { label: 'Mandhiri', title: 'Minister', score: 600, icon: '📜', color: 'var(--cyan)' },
  senapathi: { label: 'Senapathi', title: 'Commander', score: 500, icon: '⚔️', color: 'var(--red)' },
  sipahi: { label: 'Sipahi', title: 'Soldier', score: 400, icon: '🛡️', color: 'var(--green)' },
  vaidyar: { label: 'Vaidyar', title: 'Royal Doctor', score: 300, icon: '🌿', color: '#9ef0a0' },
  purohit: { label: 'Purohit', title: 'Priest', score: 200, icon: '🪔', color: '#ffc46b' },
  sevakan: { label: 'Sevakan', title: 'Servant', score: 100, icon: '🤝', color: '#bca7ff' },
  bhikari: { label: 'Bhikari', title: 'Beggar', score: 50, icon: '🥣', color: '#c8c8c8' },
  thief: { label: 'Thief', title: 'Thief', score: 0, icon: '🕵️', color: 'var(--text-dim)' },
};

export const characterInfo = (key) => CHARACTERS[key] || { label: 'Hidden', title: 'Hidden', score: 0, icon: '❔', color: 'var(--text-dim)' };
