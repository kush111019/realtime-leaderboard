const mongoose = require("mongoose");

const VALID_REGIONS = ["IND", "US", "EU"];
const VALID_MODES = ["ranked", "casual"];

const leaderboardSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  playerName: { type: String, required: true },

  score: { type: Number, default: 0 },

  region: { 
    type: String, 
    required: true,
    enum: VALID_REGIONS 
  },

  mode: { 
    type: String, 
    required: true,
    enum: VALID_MODES 
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// TTL: delete after 24 hours
leaderboardSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Compound index for leaderboard queries
leaderboardSchema.index({ region: 1, mode: 1, score: -1, updatedAt: -1 });

// Auto-update updatedAt on update
leaderboardSchema.pre("findOneAndUpdate", async function () {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
