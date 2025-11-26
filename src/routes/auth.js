const express = require("express");
const bcrypt = require("bcrypt"); // or "bcryptjs" if you installed that
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Register - create user, DO NOT return JWT (per your requirement)
router.post("/register", async (req, res) => {
  const { name, email, password, region, mode } = req.body;
  if (!name || !email || !password || !region || !mode) {
    return res.status(400).json({ message: "All fields required" });
  }
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "User already exists" });

    const user = new User({ name, email, password, region, mode });
    await user.save();
    res.status(201).json({ message: "User registered", user: { email, name, region, mode } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login - return JWT
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing fields" });

  try {
   // Example login controller
const user = await User.findOne({ email });
if (!user) return res.status(401).json({ message: "Invalid credentials" });

// Verify password here (assuming bcrypt)
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

// Generate JWT
const token = jwt.sign({ id: user._id, region: user.region }, process.env.JWT_SECRET, { expiresIn: '7d' });

// **Return token AND user details**
res.json({
  token,
  name: user.name,
  region: user.region
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
