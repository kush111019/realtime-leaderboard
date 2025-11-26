// client.js
const readline = require("readline");
const axios = require("axios");
const io = require("socket.io-client");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let token = null;
let user = null;
let socket = null;
let leaderboardData = [];
let topN = 10; // default

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

// Print leaderboard non-blocking
const printLeaderboard = () => {
  // move cursor to top-left and clear everything below
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);

  console.log(`=== TOP ${topN} PLAYERS (region=${user.region}, mode=ranked) ===`);
  leaderboardData.slice(0, topN).forEach((p, i) => {
    const highlight = String(p.playerId) === String(user.id) ? " <- YOU" : "";
    console.log(`${i + 1}. ${p.playerName} - ${p.score}${highlight}`);
  });
  rl.prompt(true);
};

// Login
const login = async () => {
  const email = await ask("Email: ");
  const password = await ask("Password: ");

  try {
    const res = await axios.post("http://localhost:4000/auth/login", { email, password });
    token = res.data.token;
    user = {
      id: res.data.user?.id || res.data.id,
      name: res.data.user?.name || res.data.name,
      region: res.data.user?.region || res.data.region
    };

    console.log(`Logged in: ${user.name} region: ${user.region}`);

    const n = await ask("How many top players do you want to see? ");
    topN = Math.max(1, parseInt(n) || 10);
    console.log(`Showing Top ${topN} players...\n`);
  } catch (err) {
    console.error("Login failed:", err.response?.data || err.message);
    process.exit(1);
  }
};

// Fetch top players (requests more rows, client will slice to topN)
const fetchTopPlayers = async () => {
  try {
    const res = await axios.get(
      `http://localhost:4000/user/leaderboard/top?region=${user.region}&mode=ranked&limit=1000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    leaderboardData = res.data || [];
    printLeaderboard();
  } catch (err) {
    console.error("Failed to fetch top players:", err.response?.data || err.message);
  }
};

// Socket connect and join room using the same object (region, mode)
// Pass token via auth so server can verify it via handshake.auth.token
const connectSocket = () => {
  socket = io("http://localhost:4000", {
    auth: { token }
  });

  socket.on("connect", () => {
    console.log(`Socket connected: ${socket.id}`);
    // join a region:mode room by sending the same object the server expects
    socket.emit("joinRoom", { region: user.region, mode: "ranked" });
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connect_error:", err.message || err);
  });

  // When server tells us leaderboard changed, fetch fresh list
  socket.on("leaderboardUpdate", async () => {
    await fetchTopPlayers(); // auto refresh
  });
};

// Update score REST call
const updateScoreCLI = async () => {
  const points = await ask("Points to add: ");
  try {
    await axios.post(
      "http://localhost:4000/user/updateScore",
      { increment: parseInt(points), region: user.region, mode: "ranked" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // server will emit leaderboardUpdate -> client will fetchTopPlayers()
  } catch (err) {
    console.error("Failed to update score:", err.response?.data || err.message);
  }
};

// CLI loop with option to change topN dynamically
const mainLoop = async () => {
  rl.setPrompt("> (u=update, n=change top N, q=quit) : ");
  rl.prompt();

  rl.on("line", async (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === "q") {
      socket?.disconnect();
      rl.close();
      process.exit(0);
    } else if (cmd === "u") {
      await updateScoreCLI();
    } else if (cmd === "n") {
      const n = await ask("Enter new Top N value: ");
      topN = Math.max(1, parseInt(n) || topN);
      printLeaderboard();
    }
    rl.prompt();
  });
};

// start
const run = async () => {
  await login();
  await fetchTopPlayers(); // initial fetch
  connectSocket();
  mainLoop();
};

run();
