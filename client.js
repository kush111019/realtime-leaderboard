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

// Helper to prompt user
const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

// Print leaderboard in CLI without blocking prompt
const printLeaderboard = () => {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);

  console.log("=== TOP PLAYERS ===");
  leaderboardData.slice(0, 10).forEach((p, i) => {
    const highlight = p.playerId === user.id ? " <- YOU" : "";
    console.log(`${i + 1}. ${p.playerName} - ${p.score}${highlight}`);
  });
  rl.prompt(true);
};

// Login flow
const login = async () => {
  const email = await ask("Email: ");
  const password = await ask("Password: ");

  try {
    const res = await axios.post("http://localhost:4000/auth/login", {
      email,
      password
    });

    token = res.data.token;
    user = {
      id: res.data.user?.id || res.data.id,
      name: res.data.user?.name || res.data.name,
      region: res.data.user?.region || res.data.region
    };

    console.log(`Logged in: ${user.name} region: ${user.region}`);
  } catch (err) {
    console.error("Login failed:", err.response?.data || err.message);
    process.exit(1);
  }
};

// Fetch latest top players from server
const fetchTopPlayers = async () => {
  try {
    const res = await axios.get(
      `http://localhost:4000/user/leaderboard/top?region=${user.region}&mode=ranked&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    leaderboardData = res.data;
    printLeaderboard();
  } catch (err) {
    console.error("Failed to fetch top players:", err.response?.data || err.message);
  }
};

// Connect to Socket.io
const connectSocket = () => {
  socket = io("http://localhost:4000", {
    query: { token } // use query for server auth
  });

  socket.on("connect", () => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room properly with { region, mode } object
    socket.emit("joinRegion", { region: user.region, mode: "ranked" });
  });

  // Auto-refresh leaderboard whenever server emits update
  socket.on("leaderboardUpdate", async () => {
    await fetchTopPlayers();
  });
};

// CLI for updating score
const updateScoreCLI = async () => {
  const points = await ask("Points to add: ");
  try {
    await axios.post(
      "http://localhost:4000/user/updateScore",
      { increment: parseInt(points), region: user.region, mode: "ranked" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error("Failed to update score:", err.response?.data || err.message);
  }
};

// CLI main loop
const mainLoop = async () => {
  rl.setPrompt("> (u=update, t=top, q=quit) : ");
  rl.prompt();

  rl.on("line", async (input) => {
    if (input === "q") {
      rl.close();
      process.exit(0);
    } else if (input === "u") {
      await updateScoreCLI();
    } else if (input === "t") {
      await fetchTopPlayers();
    }
    rl.prompt();
  });
};

// Run the client
const run = async () => {
  await login();
  await fetchTopPlayers();
  connectSocket(); // Connect socket after login
  mainLoop();
};

run();
