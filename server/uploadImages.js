require('dotenv').config();
const path      = require('path');
const fs        = require('fs');
const mongoose  = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Card      = require('./models/Card');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES_DIR = path.join(
  __dirname,
  '../client/public/Naruto Characters'
);

// Karin has no image; swap her for Kurenai Yuhi which does
const KURENAI_STATS = {
  power: 70, speed: 72, intelligence: 80,
  strength: 62, defense: 68, popularity: 70,
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected\n');

  // ── 1. Fix Karin → Kurenai Yuhi ───────────────────────────────────────────
  const karin = await Card.findOne({ name: 'Karin' });
  if (karin) {
    await Card.deleteOne({ name: 'Karin' });
    console.log('Removed Karin from DB');
  }
  const kurenaiExists = await Card.findOne({ name: 'Kurenai Yuhi' });
  if (!kurenaiExists) {
    await Card.create({
      name:     'Kurenai Yuhi',
      image:    `https://placehold.co/400x560/12121a/a855f7?text=Kurenai+Yuhi`,
      category: 'anime',
      stats:    KURENAI_STATS,
    });
    console.log('Added Kurenai Yuhi to DB');
  }

  // ── 2. Upload every image and update the card ──────────────────────────────
  const files = fs.readdirSync(IMAGES_DIR).filter((f) =>
    /\.(png|jpg|jpeg|webp)$/i.test(f)
  );

  console.log(`\nFound ${files.length} images — starting upload...\n`);

  let success = 0;
  let skipped = 0;
  let failed  = 0;

  for (const file of files) {
    const cardName = path.basename(file, path.extname(file)); // strip extension
    const card = await Card.findOne({ name: cardName });

    if (!card) {
      console.log(`  SKIP  — no card named "${cardName}" in DB`);
      skipped++;
      continue;
    }

    const filePath  = path.join(IMAGES_DIR, file);
    const publicId  = `trumpcard/cards/card-${cardName.replace(/\s+/g, '-').replace(/[()]/g, '').toLowerCase()}`;

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        public_id:      publicId,
        overwrite:      true,
        transformation: [{ width: 400, height: 560, crop: 'fill', gravity: 'face' }],
      });

      card.image = result.secure_url;
      await card.save();

      console.log(`  OK    — ${cardName}`);
      success++;
    } catch (err) {
      console.error(`  FAIL  — ${cardName}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`  Uploaded : ${success}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Failed   : ${failed}`);
  console.log(`─────────────────────────────────\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
