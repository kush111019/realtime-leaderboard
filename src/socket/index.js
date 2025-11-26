// socket/index.js
const jwt = require("jsonwebtoken");

module.exports = (io) => {
  // Accept token from handshake.auth.token (client sends auth:{ token })
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: token required"));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.id };
      return next();
    } catch (err) {
      return next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id, "userId:", socket.user?.id);

    // Accept joinRoom with object { region, mode }
    socket.on("joinRoom", ({ region, mode } = {}) => {
      if (!region || !mode) {
        console.warn("joinRoom missing fields:", { region, mode });
        return;
      }
      const room = `${region}:${mode}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
