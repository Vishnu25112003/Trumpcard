require('dotenv').config();
const mongoose = require('mongoose');
const Card = require('./models/Card');

const placeholder = (name) =>
  `https://placehold.co/400x560/12121a/a855f7?text=${encodeURIComponent(name)}`;

const CARDS = [
  // ── S-Tier ────────────────────────────────────────────────────────────────
  { name: 'Kaguya Otsutsuki',  stats: { power:100, speed: 96, intelligence: 90, strength: 95, defense: 99, popularity: 80 } },
  { name: 'Madara Uchiha',     stats: { power: 99, speed: 95, intelligence: 97, strength: 96, defense: 97, popularity: 96 } },
  { name: 'Naruto Uzumaki',    stats: { power: 98, speed: 97, intelligence: 70, strength: 95, defense: 92, popularity: 99 } },
  { name: 'Hashirama Senju',   stats: { power: 98, speed: 88, intelligence: 88, strength: 92, defense: 96, popularity: 90 } },
  { name: 'Sasuke Uchiha',     stats: { power: 97, speed: 96, intelligence: 92, strength: 85, defense: 88, popularity: 97 } },
  { name: 'Might Guy',         stats: { power: 96, speed: 98, intelligence: 70, strength: 97, defense: 75, popularity: 92 } },
  { name: 'Minato Namikaze',   stats: { power: 95, speed: 99, intelligence: 95, strength: 80, defense: 85, popularity: 97 } },
  { name: 'Pain Nagato',       stats: { power: 95, speed: 85, intelligence: 95, strength: 82, defense: 90, popularity: 92 } },

  // ── A-Tier ────────────────────────────────────────────────────────────────
  { name: 'Obito Uchiha',      stats: { power: 94, speed: 90, intelligence: 90, strength: 85, defense: 90, popularity: 88 } },
  { name: 'Itachi Uchiha',     stats: { power: 92, speed: 93, intelligence: 98, strength: 76, defense: 85, popularity: 98 } },
  { name: 'Jiraiya',           stats: { power: 92, speed: 85, intelligence: 90, strength: 85, defense: 85, popularity: 95 } },
  { name: 'Tobirama Senju',    stats: { power: 92, speed: 96, intelligence: 95, strength: 82, defense: 86, popularity: 85 } },
  { name: 'Killer Bee',        stats: { power: 90, speed: 86, intelligence: 72, strength: 90, defense: 86, popularity: 82 } },
  { name: 'Kisame Hoshigaki',  stats: { power: 90, speed: 80, intelligence: 78, strength: 88, defense: 88, popularity: 82 } },
  { name: 'Gaara',             stats: { power: 90, speed: 78, intelligence: 88, strength: 72, defense: 94, popularity: 94 } },
  { name: 'A Fourth Raikage',  stats: { power: 90, speed: 95, intelligence: 78, strength: 96, defense: 90, popularity: 78 } },
  { name: 'Hiruzen Sarutobi',  stats: { power: 90, speed: 80, intelligence: 95, strength: 78, defense: 85, popularity: 82 } },
  { name: 'Kakashi Hatake',    stats: { power: 88, speed: 90, intelligence: 95, strength: 75, defense: 80, popularity: 97 } },
  { name: 'Tsunade',           stats: { power: 88, speed: 78, intelligence: 88, strength: 98, defense: 90, popularity: 88 } },
  { name: 'Orochimaru',        stats: { power: 88, speed: 82, intelligence: 96, strength: 78, defense: 85, popularity: 85 } },
  { name: 'Onoki',             stats: { power: 88, speed: 72, intelligence: 88, strength: 65, defense: 88, popularity: 72 } },

  // ── B-Tier ────────────────────────────────────────────────────────────────
  { name: 'Kabuto Yakushi',    stats: { power: 86, speed: 82, intelligence: 92, strength: 75, defense: 84, popularity: 75 } },
  { name: 'Deidara',           stats: { power: 85, speed: 85, intelligence: 80, strength: 65, defense: 72, popularity: 82 } },
  { name: 'Sasori',            stats: { power: 85, speed: 75, intelligence: 90, strength: 72, defense: 88, popularity: 80 } },
  { name: 'Kakuzu',            stats: { power: 85, speed: 75, intelligence: 82, strength: 82, defense: 90, popularity: 72 } },
  { name: 'Mei Terumi',        stats: { power: 84, speed: 80, intelligence: 82, strength: 72, defense: 80, popularity: 78 } },
  { name: 'Rock Lee',          stats: { power: 82, speed: 92, intelligence: 65, strength: 90, defense: 72, popularity: 88 } },
  { name: 'Sakura Haruno',     stats: { power: 82, speed: 75, intelligence: 85, strength: 92, defense: 85, popularity: 72 } },
  { name: 'Zabuza Momochi',    stats: { power: 82, speed: 80, intelligence: 80, strength: 82, defense: 78, popularity: 82 } },
  { name: 'Neji Hyuga',        stats: { power: 80, speed: 84, intelligence: 88, strength: 75, defense: 82, popularity: 85 } },
  { name: 'Konan',             stats: { power: 80, speed: 78, intelligence: 85, strength: 65, defense: 80, popularity: 78 } },
  { name: 'Yamato',            stats: { power: 80, speed: 75, intelligence: 82, strength: 75, defense: 82, popularity: 72 } },
  { name: 'Jugo',              stats: { power: 80, speed: 72, intelligence: 62, strength: 90, defense: 82, popularity: 68 } },

  // ── C-Tier ────────────────────────────────────────────────────────────────
  { name: 'Hidan',             stats: { power: 75, speed: 72, intelligence: 58, strength: 78, defense: 95, popularity: 78 } },
  { name: 'Haku',              stats: { power: 75, speed: 88, intelligence: 72, strength: 65, defense: 78, popularity: 82 } },
  { name: 'Chiyo',             stats: { power: 72, speed: 65, intelligence: 90, strength: 55, defense: 70, popularity: 72 } },
  { name: 'Sai',               stats: { power: 75, speed: 78, intelligence: 80, strength: 70, defense: 72, popularity: 72 } },
  { name: 'Hinata Hyuga',      stats: { power: 76, speed: 78, intelligence: 78, strength: 70, defense: 75, popularity: 88 } },
  { name: 'Temari',            stats: { power: 76, speed: 74, intelligence: 80, strength: 68, defense: 72, popularity: 78 } },
  { name: 'Asuma Sarutobi',    stats: { power: 78, speed: 78, intelligence: 82, strength: 75, defense: 75, popularity: 78 } },
  { name: 'Choji Akimichi',    stats: { power: 78, speed: 62, intelligence: 65, strength: 92, defense: 80, popularity: 70 } },
  { name: 'Shikamaru Nara',    stats: { power: 72, speed: 70, intelligence: 99, strength: 60, defense: 68, popularity: 90 } },
  { name: 'Kankuro',           stats: { power: 72, speed: 68, intelligence: 78, strength: 65, defense: 70, popularity: 65 } },
  { name: 'Konohamaru',        stats: { power: 72, speed: 72, intelligence: 68, strength: 68, defense: 68, popularity: 78 } },
  { name: 'Suigetsu Hozuki',   stats: { power: 72, speed: 75, intelligence: 68, strength: 75, defense: 78, popularity: 70 } },
  { name: 'Kiba Inuzuka',      stats: { power: 70, speed: 78, intelligence: 62, strength: 72, defense: 68, popularity: 68 } },
  // ── D-Tier ────────────────────────────────────────────────────────────────
  { name: 'Shino Aburame',     stats: { power: 68, speed: 65, intelligence: 82, strength: 60, defense: 70, popularity: 62 } },
  { name: 'Tenten',            stats: { power: 68, speed: 70, intelligence: 72, strength: 62, defense: 65, popularity: 60 } },
  { name: 'Ino Yamanaka',      stats: { power: 65, speed: 68, intelligence: 80, strength: 60, defense: 62, popularity: 72 } },
  { name: 'Zetsu',             stats: { power: 65, speed: 70, intelligence: 88, strength: 60, defense: 70, popularity: 62 } },
  { name: 'Karin',             stats: { power: 62, speed: 68, intelligence: 78, strength: 58, defense: 72, popularity: 70 } },
  { name: 'Iruka Umino',       stats: { power: 58, speed: 60, intelligence: 72, strength: 58, defense: 60, popularity: 80 } },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    await Card.deleteMany({});
    console.log('Cleared existing cards');

    const docs = CARDS.map((c) => ({
      name:     c.name,
      image:    placeholder(c.name),
      category: 'anime',
      stats:    c.stats,
    }));

    await Card.insertMany(docs);
    console.log(`Seeded ${docs.length} cards successfully`);

    // Quick sanity check
    const count = await Card.countDocuments();
    console.log(`Total cards in DB: ${count}`);

  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
