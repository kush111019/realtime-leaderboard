require("dotenv").config();
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { connectDB } = require("./config/mongoose");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const socketHandler = require("./socket");

const app = express();
app.use(express.json());

// Create HTTP + Socket server
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

// Attach io so REST APIs can use it: req.app.get("io")
app.set("io", io);

// Initialize socket logic (join rooms, broadcast, etc.)
socketHandler(io);

// Register routes AFTER socket setup
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

// Connect database
connectDB();

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
