
// server.js completo com rotas organizadas (trecho principal)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/warzone";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "929424";

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Rate limit
app.use("/api/", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, try again later."
}));

// MongoDB connection
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB conectado");
}).catch((err) => {
    console.error("❌ Erro ao conectar ao MongoDB:", err);
});

// Modelos
const teamSchema = new mongoose.Schema({
    position: Number,
    name: { type: String, required: true, unique: true },
    tag: { type: String, required: true },
    kills: { type: Number, default: 0 },
    status: { type: String, default: "online" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const killSchema = new mongoose.Schema({
    position: Number,
    player: { type: String, required: true },
    kills: { type: Number, default: 0 },
    team: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const gameNumberSchema = new mongoose.Schema({
    current: { type: Number, default: 1 },
    total: { type: Number, default: 10 },
    updatedAt: { type: Date, default: Date.now }
});

const Team = mongoose.model("Team", teamSchema);
const Kill = mongoose.model("Kill", killSchema);
const GameNumber = mongoose.model("GameNumber", gameNumberSchema);

// Autenticação admin
const authenticateAdmin = (req, res, next) => {
    if (req.headers['x-admin-password'] === ADMIN_PASSWORD) return next();
    res.status(401).json({ error: "Unauthorized" });
};

// Rotas principais da API
app.get("/api/teams", async (req, res) => {
    const teams = await Team.find().sort({ position: 1 });
    res.json(teams);
});

app.post("/api/teams", authenticateAdmin, async (req, res) => {
    const { name, tag, kills } = req.body;
    const count = await Team.countDocuments();
    const last = await Team.findOne().sort({ position: -1 });
    const position = last ? last.position + 1 : 1;
    const team = new Team({ name, tag, kills, position });
    await team.save();
    res.status(201).json(team);
});

app.put("/api/teams/:id", authenticateAdmin, async (req, res) => {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(team);
});

app.delete("/api/teams/:id", authenticateAdmin, async (req, res) => {
    await Team.findByIdAndDelete(req.params.id);
    res.status(204).end();
});

app.get("/api/kills", async (req, res) => {
    const kills = await Kill.find().sort({ kills: -1 });
    res.json(kills);
});

app.post("/api/kills", authenticateAdmin, async (req, res) => {
    const count = await Kill.countDocuments();
    const position = count + 1;
    const kill = new Kill({ ...req.body, position });
    await kill.save();
    res.status(201).json(kill);
});

app.put("/api/kills/:id", authenticateAdmin, async (req, res) => {
    const kill = await Kill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(kill);
});

app.delete("/api/kills/:id", authenticateAdmin, async (req, res) => {
    await Kill.findByIdAndDelete(req.params.id);
    res.status(204).end();
});

// GET game-number
app.get("/api/game-number", async (req, res) => {
    try {
        let gameNumber = await GameNumber.findOne();
        if (!gameNumber) {
            gameNumber = new GameNumber();
            await gameNumber.save();
        }
        res.json(gameNumber);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar game number" });
    }
});

// PUT game-number
app.put("/api/game-number", authenticateAdmin, async (req, res) => {
    const { current, total } = req.body;
    let gameNumber = await GameNumber.findOne();
    if (!gameNumber) {
        gameNumber = new GameNumber({ current, total });
    } else {
        gameNumber.current = current;
        gameNumber.total = total;
        gameNumber.updatedAt = Date.now();
    }
    await gameNumber.save();
    res.json(gameNumber);
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
