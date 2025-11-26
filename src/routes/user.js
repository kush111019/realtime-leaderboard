const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Leaderboard = require("../models/Leaderboard");

// auth middleware for REST
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) { return res.status(401).json({ message: "Invalid token" }); }
};

// POST /user/updateScore
// Client calls this to increment the player's score (REST trigger)
// Server will upsert the leaderboard entry and broadcast via Socket.io
router.post("/updateScore", auth, async (req, res) => {
  try {
    const { increment, region, mode } = req.body;

    if (!increment || !region || !mode) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Validate allowed region + mode
    const VALID_REGIONS = ["IND", "US", "EU"];
    const VALID_MODES = ["ranked", "casual"];

    if (!VALID_REGIONS.includes(region)) {
      return res.status(400).json({ message: "Invalid region" });
    }
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ message: "Invalid mode" });
    }

    // load user details
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // upsert leaderboard entry (auto updates updatedAt using schema pre-hook)
    const entry = await Leaderboard.findOneAndUpdate(
      { playerId: user._id, region, mode },
      {
        $inc: { score: parseInt(increment) },
        $set: { playerName: user.name },
        $setOnInsert: { createdAt: new Date() }
      },
      { new: true, upsert: true }
    );

    // broadcast via socket room (region:mode)
    const io = req.app.get("io");
    io.to(`${region}:${mode}`).emit("leaderboardUpdate", {
      playerId: entry.playerId,
      playerName: entry.playerName,
      score: entry.score,
      region: entry.region,
      mode: entry.mode
    });

    res.json({ message: "Score updated and broadcasted", entry });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /user/leaderboard/top?region=IND&mode=ranked&limit=10
router.get("/leaderboard/top", auth, async (req, res) => {
  try {
    const { region, mode, limit = 10 } = req.query;
    if (!region || !mode) return res.status(400).json({ message: "Region & mode required" });

    const top = await Leaderboard.find({ region, mode })
      .sort({ score: -1, updatedAt: -1 })
      .limit(parseInt(limit));

    res.json(top);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
