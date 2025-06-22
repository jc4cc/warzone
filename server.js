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
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://jcuser:929424@clusterwarzone.7heoa9p.mongodb.net/?retryWrites=true&w=majority&appName=Clusterwarzone";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "929424";

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const password = req.headers['x-admin-password'];
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

// Update timestamps on save
teamSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

killSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

const Team = mongoose.model("Team", teamSchema);
const Kill = mongoose.model("Kill", killSchema);

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

        // Check if team already exists
        const existingTeam = await Team.findOne({ name: name.toUpperCase() });
        if (existingTeam) {
            return res.status(409).json({ error: "Team already exists" });
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
        res.status(500).json({ error: "Failed to create team" });
    }
});

// Update team (Admin only)
app.put("/api/teams/:id", authenticateAdmin, async (req, res) => {
    try {
        const { name, tag, kills, status } = req.body;
        
        const team = await Team.findByIdAndUpdate(
            req.params.id,
            { name, tag, kills, status },
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
        let kill = await Kill.findOne({ player: player.toUpperCase() });
        
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

// Admin authentication endpoint
app.post("/api/admin/authenticate", authenticateAdmin, (req, res) => {
    res.json({ message: "Authentication successful" });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Helper function to update team positions
async function updateTeamPositions() {
    try {
        const teams = await Team.find().sort({ kills: -1, createdAt: 1 });
        
        for (let i = 0; i < teams.length; i++) {
            teams[i].position = i + 1;
            await teams[i].save();
        }
    } catch (error) {
        console.error("Error updating team positions:", error);
    }
}

// Helper function to update kill positions
async function updateKillPositions() {
    try {
        const kills = await Kill.find().sort({ kills: -1, createdAt: 1 });
        
        for (let i = 0; i < kills.length; i++) {
            kills[i].position = i + 1;
            await kills[i].save();
        }
    } catch (error) {
        console.error("Error updating kill positions:", error);
    }
}

// Initialize default data if database is empty
async function initializeDefaultData() {
    try {
        const teamCount = await Team.countDocuments();
        
        if (teamCount === 0) {
            console.log("🔄 Initializing default data...");
            
            const defaultTeams = [
                { position: 1, name: "HAVOC", tag: "MIXED STAFF", kills: 83, status: "online" },
                { position: 2, name: "BLAZT", tag: "SARGERIUM SKULLFAÇE", kills: 11, status: "online" },
                { position: 3, name: "LA ELE", tag: "CERASUS", kills: 10, status: "online" },
                { position: 4, name: "ECHO", tag: "FRAXELL LEGION", kills: 2, status: "online" },
                { position: 5, name: "CONGY", tag: "NEWBZ GAME", kills: 0, status: "online" },
                { position: 6, name: "ADRIAN", tag: "DESTROY UNRATIONAL", kills: 0, status: "online" },
                { position: 7, name: "DEKI", tag: "LAYZE STRIKE", kills: 0, status: "online" },
                { position: 8, name: "RMR", tag: "CASTILLO ZWARE", kills: 0, status: "online" },
                { position: 9, name: "SPARKTYN", tag: "SPARKTYN RYGA", kills: 0, status: "online" },
                { position: 10, name: "OTTERSEVES", tag: "FAMILIA ZENT", kills: 0, status: "online" },
                { position: 11, name: "PHANTOM", tag: "SHADOW OPS", kills: 0, status: "online" },
                { position: 12, name: "VIPER", tag: "COBRA STRIKE", kills: 0, status: "online" },
                { position: 13, name: "GHOST", tag: "SILENT KILLERS", kills: 0, status: "online" },
                { position: 14, name: "TITAN", tag: "IRON FIST", kills: 0, status: "online" },
                { position: 15, name: "WOLF", tag: "LONE PACK", kills: 0, status: "online" }
            ];

            await Team.insertMany(defaultTeams);

            const defaultKills = [
                { position: 1, player: "CRUSE GIGA", kills: 5, team: "HAVOC" },
                { position: 2, player: "SPARKO", kills: 4, team: "BLAZT" },
                { position: 3, player: "JC", kills: 3, team: "LA ELE" },
                { position: 4, player: "CLUNGY FLAMED AZTEC", kills: 2, team: "ECHO" },
                { position: 5, player: "SPARKO FORESTER SPARKTYN", kills: 1, team: "CONGY" }
            ];

            await Kill.insertMany(defaultKills);
            
            console.log("✅ Default data initialized");
        }
    } catch (error) {
        console.error("❌ Error initializing default data:", error);
    }
}

// Serve the main page
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((error, req, res, next) => {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
});

// Start server
server.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Access the app at: http://localhost:${PORT}`);
    
    // Initialize default data
    await initializeDefaultData();
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received, shutting down gracefully");
    server.close(() => {
        console.log("💤 Process terminated");
        mongoose.connection.close();
    });
});

process.on("SIGINT", () => {
    console.log("🛑 SIGINT received, shutting down gracefully");
    server.close(() => {
        console.log("💤 Process terminated");
        mongoose.connection.close();
    });
});

module.exports = app;


