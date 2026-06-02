const mongoose = require('mongoose');

const connectDB = async (retries = 5, delayMs = 3000) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MongoDB: MONGODB_URI is not set. Create backend/.env or export MONGODB_URI before starting the server.');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.error(`MongoDB attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`Retrying in ${delayMs / 1000}s...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        console.error('MongoDB: all retries exhausted. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
