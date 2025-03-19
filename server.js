const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const PORT = 3000;

// MongoDB connection URI
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

// Middleware to parse JSON
app.use(express.json());

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, "public")));

// Track used words for the session
let usedWords = [];

// Connect to MongoDB and run server
async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const db = client.db("antakshari_db");
    const wordsCollection = db.collection("words");

    // Get a random word to start the game
    app.get("/start", async (req, res) => {
      const words = await wordsCollection.aggregate([{ $sample: { size: 1 } }]).toArray();
      if (words.length > 0) {
        const startingWord = words[0].word;
        usedWords = [startingWord.toLowerCase()]; // Reset used words
        res.json({ word: startingWord });
      } else {
        res.status(500).send("No words found in the database.");
      }
    });

    // Check user-submitted word
    app.post("/check-word", async (req, res) => {
      const { userWord, lastLetter } = req.body;
      const wordLower = userWord.toLowerCase();

      // Check if the word starts with the correct letter
      if (!userWord || wordLower[0] !== lastLetter.toLowerCase()) {
        return res.status(400).send(`❌ Invalid word. It must start with "${lastLetter.toUpperCase()}".`);
      }

      // Check if the word has already been used
      if (usedWords.includes(wordLower)) {
        return res.status(400).send("❌ Word already used! Try another word.");
      }

      // Check if the word exists in the database
      const foundWord = await wordsCollection.findOne({ word: userWord });
      if (foundWord) {
        usedWords.push(wordLower); // Add word to used list
        res.json({ valid: true, message: "✅ Valid word! Continue..." });
      } else {
        res.status(400).send("❌ Word not found in the database.");
      }
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Connection error:", err);
  }
}

run();
