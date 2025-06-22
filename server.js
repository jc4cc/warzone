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
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://jcuser:929424@clusterwarzone.xhyxdi8.mongodb.net/?retryWrites=true&w=majority&appName=Clusterwarzone";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "929424";

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.set("trust proxy", true);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const password = req.headers["x-admin-password"];
    if (password === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
};

// Serve static files
app.use(express.static("."));

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("✅ Connected to MongoDB");
})
.catch((error) => {
    console.error("❌ MongoDB connection error:", error);
});

// Team Schema
const teamSchema = new mongoose.Schema({
    position: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    tag: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    kills: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ["online", "offline"],
        default: "online"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Individual Kill Schema
const killSchema = new mongoose.Schema({
    position: {
        type: Number,
        required: true
    },
    player: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    kills: {
        type: Number,
        default: 1,
        min: 0
    },
    team: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Game Number Schema
const gameNumberSchema = new mongoose.Schema({
    current: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    total: {
        type: Number,
        default: 10,
        min: 1
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Champion Team Schema - NOVA FUNCIONALIDADE
const championSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true
    },
    teamName: {
        type: String,
        required: true,
        uppercase: true
    },
    teamTag: {
        type: String,
        required: true,
        uppercase: true
    },
    finalKills: {
        type: Number,
        required: true
    },
    championshipDate: {
        type: Date,
        default: Date.now
    },
    gameNumber: {
        type: Number,
        default: 1
    },
    notes: {
        type: String,
        default: ""
    }
});

// Global Settings Schema - NOVO ESQUEMA
const globalSettingsSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
teamSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

killSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

gameNumberSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

globalSettingsSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

const Team = mongoose.model("Team", teamSchema);
const Kill = mongoose.model("Kill", killSchema);
const GameNumber = mongoose.model("GameNumber", gameNumberSchema);
const Champion = mongoose.model("Champion", championSchema);
const GlobalSetting = mongoose.model("GlobalSetting", globalSettingsSchema);

// Socket.IO for real-time updates
io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔌 User disconnected:", socket.id);
    });

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });
});

// Broadcast function for real-time updates
function broadcastUpdate(event, data) {
    io.emit(event, data);
}

// API Routes

// Get all teams
app.get("/api/teams", async (req, res) => {
    try {
        const teams = await Team.find().sort({ position: 1 });
        res.json(teams);
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ error: "Failed to fetch teams" });
    }
});

// Get team by ID
app.get("/api/teams/:id", async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }
        res.json(team);
    } catch (error) {
        console.error("Error fetching team:", error);
        res.status(500).json({ error: "Failed to fetch team" });
    }
});

// Create new team (Admin only)
app.post("/api/teams", authenticateAdmin, async (req, res) => {
    try {
        const { name, tag, kills = 0 } = req.body;

        if (!name || !tag) {
            return res.status(400).json({ error: "Name and tag are required" });
        }

        // Check if team already exists (case-insensitive for name and tag)
        const existingTeam = await Team.findOne({ $or: [
            { name: new RegExp(`^${name}$`, 'i') },
            { tag: new RegExp(`^${tag}$`, 'i') }
        ]});
        if (existingTeam) {
            return res.status(409).json({ error: "Team with this name or tag already exists." });
        }

        // Check team limit
        const teamCount = await Team.countDocuments();
        if (teamCount >= 18) {
            return res.status(400).json({ error: "Maximum 18 teams allowed" });
        }

        // Get next position
        const lastTeam = await Team.findOne().sort({ position: -1 });
        const position = lastTeam ? lastTeam.position + 1 : 1;

        const team = new Team({
            position,
            name: name.toUpperCase(),
            tag: tag.toUpperCase(),
            kills,
            status: "online"
        });

        await team.save();
        
        // Update positions based on kills
        await updateTeamPositions();
        
        // Broadcast update
        broadcastUpdate("team-added", team);
        
        res.status(201).json(team);
    } catch (error) {
        console.error("Error creating team:", error);
        // More specific error handling for Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to create team" });
    }
});

// Update team (Admin only)
app.put("/api/teams/:id", authenticateAdmin, async (req, res) => {
    try {
        const { name, tag, kills, status } = req.body;
        
        // Check if updated name or tag already exists for another team
        const existingTeam = await Team.findOne({ 
            _id: { $ne: req.params.id },
            $or: [
                { name: new RegExp(`^${name}$`, 'i') },
                { tag: new RegExp(`^${tag}$`, 'i') }
            ]
        });
        if (existingTeam) {
            return res.status(409).json({ error: "Another team with this name or tag already exists." });
        }

        const team = await Team.findByIdAndUpdate(
            req.params.id,
            { name: name.toUpperCase(), tag: tag.toUpperCase(), kills, status },
            { new: true, runValidators: true }
        );

        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        // Update positions based on kills
        await updateTeamPositions();
        
        // Broadcast update
        broadcastUpdate("team-updated", team);
        
        res.json(team);
    } catch (error) {
        console.error("Error updating team:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to update team" });
    }
});

// Add kill to team (Admin only)
app.post("/api/teams/:id/kill", authenticateAdmin, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        team.kills += 1;
        await team.save();

        // Update positions based on kills
        await updateTeamPositions();
        
        // Broadcast update
        broadcastUpdate("team-kill-added", team);
        
        res.json(team);
    } catch (error) {
        console.error("Error adding kill to team:", error);
        res.status(500).json({ error: "Failed to add kill to team" });
    }
});

// Delete team (Admin only)
app.delete("/api/teams/:id", authenticateAdmin, async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);
        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        // Update positions
        await updateTeamPositions();
        
        // Broadcast update
        broadcastUpdate("team-deleted", { id: req.params.id });
        
        res.json({ message: "Team deleted successfully" });
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).json({ error: "Failed to delete team" });
    }
});

// Update team rankings (Admin only)
app.put("/api/teams/ranking", authenticateAdmin, async (req, res) => {
    try {
        await updateTeamPositions();
        const teams = await Team.find().sort({ position: 1 });
        
        // Broadcast update
        broadcastUpdate("ranking-updated", teams);
        
        res.json(teams);
    } catch (error) {
        console.error("Error updating ranking:", error);
        res.status(500).json({ error: "Failed to update ranking" });
    }
});

// Get all individual kills
app.get("/api/kills", async (req, res) => {
    try {
        const kills = await Kill.find().sort({ position: 1 });
        res.json(kills);
    } catch (error) {
        console.error("Error fetching kills:", error);
        res.status(500).json({ error: "Failed to fetch kills" });
    }
});

// Update individual kill (Admin only)
app.put("/api/kills/:id", authenticateAdmin, async (req, res) => {
    try {
        const { player, kills, team } = req.body;
        
        const kill = await Kill.findByIdAndUpdate(
            req.params.id,
            { player, kills, team },
            { new: true, runValidators: true }
        );

        if (!kill) {
            return res.status(404).json({ error: "Individual kill not found" });
        }

        await updateKillPositions();
        broadcastUpdate("kill-updated", kill);
        res.json(kill);
    } catch (error) {
        console.error("Error updating individual kill:", error);
        res.status(500).json({ error: "Failed to update individual kill" });
    }
});

// Delete individual kill (Admin only)
app.delete("/api/kills/:id", authenticateAdmin, async (req, res) => {
    try {
        const kill = await Kill.findByIdAndDelete(req.params.id);
        if (!kill) {
            return res.status(404).json({ error: "Individual kill not found" });
        }

        await updateKillPositions();
        broadcastUpdate("kill-deleted", { id: req.params.id });
        res.json({ message: "Individual kill deleted successfully" });
    } catch (error) {
        console.error("Error deleting individual kill:", error);
        res.status(500).json({ error: "Failed to delete individual kill" });
    }
});

// Add individual kill (Admin only)
app.post("/api/kills", authenticateAdmin, async (req, res) => {
    try {
        const { player, team } = req.body;

        if (!player || !team) {
            return res.status(400).json({ error: "Player and team are required" });
        }

        // Check if player already exists
        let kill = await Kill.findOne({ player: new RegExp(`^${player}$`, 'i') });
        
        if (kill) {
            kill.kills += 1;
            await kill.save();
        } else {
            // Get next position
            const killCount = await Kill.countDocuments();
            kill = new Kill({
                position: killCount + 1,
                player: player.toUpperCase(),
                kills: 1,
                team: team.toUpperCase()
            });
            await kill.save();
        }

        // Update positions based on kills
        await updateKillPositions();
        
        // Broadcast update
        broadcastUpdate("kill-added", kill);
        
        res.status(201).json(kill);
    } catch (error) {
        console.error("Error adding kill:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to add kill" });
    }
});

// Reset all data (Admin only)
app.post("/api/reset", authenticateAdmin, async (req, res) => {
    try {
        await Team.deleteMany({});
        await Kill.deleteMany({});
        
        // Broadcast update
        broadcastUpdate("data-reset", {});
        
        res.json({ message: "All data reset successfully" });
    } catch (error) {
        console.error("Error resetting data:", error);
        res.status(500).json({ error: "Failed to reset data" });
    }
});

// Get current game number
app.get("/api/game", async (req, res) => {
    try {
        let gameNumber = await GameNumber.findOne();
        if (!gameNumber) {
            gameNumber = new GameNumber({ current: 1, total: 10 });
            await gameNumber.save();
        }
        res.json(gameNumber);
    } catch (error) {
        console.error("Error fetching game number:", error);
        res.status(500).json({ error: "Failed to fetch game number" });
    }
});

// Update game number (Admin only)
app.put("/api/game", authenticateAdmin, async (req, res) => {
    try {
        const { current, total } = req.body;
        
        let gameNumber = await GameNumber.findOne();
        if (!gameNumber) {
            gameNumber = new GameNumber();
        }
        
        if (current !== undefined) gameNumber.current = current;
        if (total !== undefined) gameNumber.total = total;
        
        await gameNumber.save();
        
        // Broadcast update to all connected clients
        broadcastUpdate("game-number-updated", gameNumber);
        
        res.json(gameNumber);
    } catch (error) {
        console.error("Error updating game number:", error);
        res.status(500).json({ error: "Failed to update game number" });
    }
});

// NOVA FUNCIONALIDADE: APIs para Equipa Vencedora

// Set champion team (Admin only)
app.post("/api/champion", authenticateAdmin, async (req, res) => {
    try {
        const { teamId, notes } = req.body;

        if (!teamId) {
            return res.status(400).json({ error: "Team ID is required" });
        }

        // Get team details
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        // Get current game number
        let gameNumber = await GameNumber.findOne();
        if (!gameNumber) {
            gameNumber = { current: 1 };
        }

        // Check if champion already exists for this game
        const existingChampion = await Champion.findOne({ gameNumber: gameNumber.current });
        if (existingChampion) {
            return res.status(409).json({ error: "Champion already set for this game" });
        }

        // Create champion record
        const champion = new Champion({
            teamId: team._id,
            teamName: team.name,
            teamTag: team.tag,
            finalKills: team.kills,
            gameNumber: gameNumber.current,
            notes: notes || `Equipa vencedora do jogo ${gameNumber.current}`
        });

        await champion.save();

        // Broadcast champion
        broadcastUpdate("champion-set", champion);

        res.status(201).json(champion);
    } catch (error) {
        console.error("Error setting champion:", error);
        res.status(500).json({ error: "Failed to set champion" });
    }
});

// Get champion team for current game
app.get("/api/champion/current", async (req, res) => {
    try {
        let gameNumber = await GameNumber.findOne();
        if (!gameNumber) {
            gameNumber = { current: 1 };
        }

        const champion = await Champion.findOne({ gameNumber: gameNumber.current });
        if (!champion) {
            return res.status(404).json({ error: "No champion found for the current game" });
        }

        res.json(champion);
    } catch (error) {
        console.error("Error fetching current champion:", error);
        res.status(500).json({ error: "Failed to fetch current champion" });
    }
});

// Remove current champion (Admin only)
app.delete("/api/champion/current", authenticateAdmin, async (req, res) => {
    try {
        let gameNumber = await GameNumber.findOne();
        if (!gameNumber) {
            gameNumber = { current: 1 };
        }

        const champion = await Champion.findOneAndDelete({ gameNumber: gameNumber.current });
        if (!champion) {
            return res.status(404).json({ error: "No champion found for the current game to remove" });
        }

        // Broadcast update
        broadcastUpdate("champion-removed", { gameNumber: gameNumber.current });

        res.json({ message: `Champion for game ${gameNumber.current} removed successfully` });
    } catch (error) {
        console.error("Error removing current champion:", error);
        res.status(500).json({ error: "Failed to remove current champion" });
    }
});

// API para configurações globais (NOVO)
app.get("/api/settings", async (req, res) => {
    try {
        const settings = await GlobalSetting.find({});
        const settingsMap = {};
        settings.forEach(setting => {
            settingsMap[setting.name] = setting.value;
        });
        res.json(settingsMap);
    } catch (error) {
        console.error("Error fetching global settings:", error);
        res.status(500).json({ error: "Failed to fetch global settings" });
    }
});

app.put("/api/settings", authenticateAdmin, async (req, res) => {
    try {
        const { name, value } = req.body;
        if (!name || value === undefined) {
            return res.status(400).json({ error: "Name and value are required" });
        }

        let setting = await GlobalSetting.findOneAndUpdate(
            { name: name },
            { value: value },
            { new: true, upsert: true, runValidators: true }
        );

        // Broadcast update
        broadcastUpdate("settings-updated", { [setting.name]: setting.value });

        res.json(setting);
    } catch (error) {
        console.error("Error updating global setting:", error);
        res.status(500).json({ error: "Failed to update global setting" });
    }
});

// Helper function to update team positions based on kills
async function updateTeamPositions() {
    const teams = await Team.find().sort({ kills: -1, name: 1 }); // Sort by kills (desc) then name (asc)
    for (let i = 0; i < teams.length; i++) {
        teams[i].position = i + 1;
        await teams[i].save();
    }
}

// Helper function to update individual kill positions based on kills
async function updateKillPositions() {
    const kills = await Kill.find().sort({ kills: -1, player: 1 }); // Sort by kills (desc) then player (asc)
    for (let i = 0; i < kills.length; i++) {
        kills[i].position = i + 1;
        await kills[i].save();
    }
}

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});


