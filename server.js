const express = require('express');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/warzone_leaderboard';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('📦 Conectado ao MongoDB'))
    .catch(err => console.error('❌ Erro de conexão ao MongoDB:', err));

// Schemas do Mongoose
const playerSchema = new mongoose.Schema({
    position: { type: Number, required: true },
    name: { type: String, required: true },
    team: { type: String, required: true },
    score: { type: Number, default: 0 },
    logo: { type: String, default: '🎮' },
    teamId: { type: Number, required: true }
}, { timestamps: true });

const killsDataSchema = new mongoose.Schema({
    position: { type: Number, required: true },
    name: { type: String, required: true },
    kills: { type: Number, default: 0 }
}, { timestamps: true });

const gameConfigSchema = new mongoose.Schema({
    currentGame: { type: Number, default: 1 },
    totalGames: { type: Number, default: 6 },
    gameStatus: { type: String, default: 'STARTING SOON' },
    isLive: { type: Boolean, default: false },
    editMode: { type: Boolean, default: false },
    victoryPointThreshold: { type: Number, default: 100 },
    isAuthenticated: { type: Boolean, default: false },
    autoSaveEnabled: { type: Boolean, default: true },
    autoSaveInterval: { type: Number, default: 10000 }
}, { timestamps: true });

// Modelos do Mongoose
const Player = mongoose.model('Player', playerSchema);
const KillsData = mongoose.model('KillsData', killsDataSchema);
const GameConfig = mongoose.model('GameConfig', gameConfigSchema);

// Função para inicializar dados padrão na base de dados
async function initializeDefaultData() {
    try {
        // Verificar se já existem dados
        const playersCount = await Player.countDocuments();
        const killsCount = await KillsData.countDocuments();
        const configCount = await GameConfig.countDocuments();

        if (playersCount === 0) {
            console.log('🔄 Inicializando jogadores padrão...');
            const defaultPlayers = [
                { position: 1, name: "BIFFLE", team: "HISOKA SHIFTY", score: 0, logo: "🌪️", teamId: 1 },
                { position: 2, name: "HAVOC", team: "MONZO SLAPPY", score: 0, logo: "⚡", teamId: 2 },
                { position: 3, name: "BLAZT", team: "GABEKUUN SKULLFACE", score: 0, logo: "💯", teamId: 3 },
                { position: 4, name: "ECHO", team: "FIFAKILL LENON", score: 0, logo: "🎯", teamId: 4 },
                { position: 5, name: "DONGY", team: "NEWBZ SAGE", score: 0, logo: "🐺", teamId: 1 },
                { position: 6, name: "ADRIAN", team: "DESTROY UNRATIONAL", score: 0, logo: "🎮", teamId: 2 },
                { position: 7, name: "DEKII", team: "LAYZE STUKEX", score: 0, logo: "🎯", teamId: 3 },
                { position: 8, name: "AMIR", team: "CASTILLO ZDARK", score: 0, logo: "🌊", teamId: 4 },
                { position: 9, name: "BRAXTYN", team: "EMPATHY RYDA", score: 0, logo: "🎮", teamId: 1 },
                { position: 10, name: "OTTEREVES", team: "ZAVOLA ZEPIT", score: 0, logo: "🎯", teamId: 3 }
            ];
            await Player.insertMany(defaultPlayers);
        }

        if (killsCount === 0) {
            console.log('🔄 Inicializando dados de kills padrão...');
            const defaultKills = [
                { position: 1, name: "DEVO SWAY TAPPA", kills: 0 },
                { position: 2, name: "CLOWHN DONJAY SHERRO", kills: 0 },
                { position: 3, name: "JOEWO OAKBOI ZLANER", kills: 0 },
                { position: 4, name: "CLIMZZY FLANKED JTECC", kills: 0 },
                { position: 5, name: "JAWAD ROBSTAR SHOWSTOPPER", kills: 0 }
            ];
            await KillsData.insertMany(defaultKills);
        }

        if (configCount === 0) {
            console.log('🔄 Inicializando configuração padrão...');
            const defaultConfig = new GameConfig({
                currentGame: 5,
                totalGames: 6,
                gameStatus: "STARTING SOON",
                isLive: false,
                editMode: false,
                victoryPointThreshold: 100,
                isAuthenticated: false,
                autoSaveEnabled: true,
                autoSaveInterval: 10000
            });
            await defaultConfig.save();
        }

        console.log('✅ Dados padrão inicializados com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar dados padrão:', error);
    }
}

// Função para carregar dados da base de dados
async function loadData() {
    try {
        const players = await Player.find().sort({ position: 1 });
        const killsData = await KillsData.find().sort({ position: 1 });
        const gameConfig = await GameConfig.findOne();

        return {
            players: players,
            killsData: killsData,
            gameConfig: gameConfig || {},
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        throw error;
    }
}

// Função para salvar dados na base de dados
async function saveData(data) {
    try {
        const { players, killsData, gameConfig } = data;

        // Atualizar jogadores
        if (players && Array.isArray(players)) {
            await Player.deleteMany({});
            await Player.insertMany(players);
        }

        // Atualizar dados de kills
        if (killsData && Array.isArray(killsData)) {
            await KillsData.deleteMany({});
            await KillsData.insertMany(killsData);
        }

        // Atualizar configuração do jogo
        if (gameConfig) {
            await GameConfig.deleteMany({});
            const newConfig = new GameConfig(gameConfig);
            await newConfig.save();
        }

        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        return false;
    }
}

// Configuração de CORS para permitir acesso de qualquer origem
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

app.use(express.json());

// Configurações
const JWT_SECRET = 'campeonato_warzone_secret_key_2025';
const ACCESS_PASSWORD = '929424';




// Middleware de autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Token de acesso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}



// Rotas da API

// Status da API
app.get('/api/status', async (req, res) => {
    try {
        const mongoStatus = mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado';
        const playersCount = await Player.countDocuments();
        const killsCount = await KillsData.countDocuments();
        const configExists = await GameConfig.countDocuments() > 0;

        res.json({
            success: true,
            message: 'API do Campeonato Warzone está funcionando!',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: {
                status: mongoStatus,
                players: playersCount,
                killsData: killsCount,
                configExists: configExists
            }
        });
    } catch (error) {
        res.json({
            success: true,
            message: 'API do Campeonato Warzone está funcionando!',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: {
                status: 'Erro ao verificar',
                error: error.message
            }
        });
    }
});

// Autenticação
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;

    if (password === ACCESS_PASSWORD) {
        const token = jwt.sign(
            { authenticated: true, timestamp: Date.now() },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Autenticação realizada com sucesso',
            token: token
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Senha incorreta'
        });
    }
});

// Obter dados do leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const data = await loadData();
        res.json({
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar dados do leaderboard'
        });
    }
});

// Salvar dados do leaderboard (requer autenticação)
app.post('/api/leaderboard/save', authenticateToken, async (req, res) => {
    try {
        const { players, killsData, gameConfig } = req.body;

        if (!players || !Array.isArray(players)) {
            return res.status(400).json({
                success: false,
                error: 'Dados de jogadores inválidos'
            });
        }

        const data = {
            players: players,
            killsData: killsData || [],
            gameConfig: gameConfig || {},
            lastUpdated: new Date().toISOString()
        };

        const saved = await saveData(data);

        if (saved) {
            res.json({
                success: true,
                message: 'Dados salvos com sucesso',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erro ao salvar dados'
            });
        }
    } catch (error) {
        console.error('Erro ao salvar leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Resetar pontuações (requer autenticação)
app.post('/api/leaderboard/reset', authenticateToken, async (req, res) => {
    try {
        // Resetar pontuações dos jogadores
        await Player.updateMany({}, { score: 0 });

        // Resetar kills
        await KillsData.updateMany({}, { kills: 0 });

        const data = await loadData();

        res.json({
            success: true,
            message: 'Pontuações resetadas com sucesso',
            data: data
        });
    } catch (error) {
        console.error('Erro ao resetar pontuações:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Backup dos dados
app.get('/api/backup', authenticateToken, async (req, res) => {
    try {
        const data = await loadData();
        const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${backupName}"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar backup'
        });
    }
});

// Restaurar backup (requer autenticação)
app.post('/api/restore', authenticateToken, async (req, res) => {
    try {
        const backupData = req.body;
        
        if (!backupData.players || !Array.isArray(backupData.players)) {
            return res.status(400).json({
                success: false,
                error: 'Dados de backup inválidos'
            });
        }

        const saved = await saveData(backupData);

        if (saved) {
            res.json({
                success: true,
                message: 'Backup restaurado com sucesso',
                data: backupData
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erro ao restaurar backup'
            });
        }
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada',
        availableRoutes: [
            'GET /api/status',
            'POST /api/auth/login',
            'GET /api/leaderboard',
            'POST /api/leaderboard/save',
            'POST /api/leaderboard/reset',
            'GET /api/backup',
            'POST /api/restore'
        ]
    });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro no servidor:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 API do Campeonato Warzone iniciada`);
    console.log(`🔗 Acesse: http://localhost:${PORT}/api/status`);
    console.log(`🗄️ Base de dados: MongoDB`);
    console.log(`🔑 Senha de acesso: ${ACCESS_PASSWORD}`);
    
    // Inicializar dados padrão
    await initializeDefaultData();
    
    console.log(`⚡ Pronto para receber requisições!`);
});

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
});

// Rota para verificar se a API está online
app.get('/api/ping', (req, res) => {
    res.status(200).json({ success: true, message: 'API Online ✅' });
});

// Endpoint para salvar dados da leaderboard
app.post('/api/leaderboard/save', async (req, res) => {
    try {
        const { players, killsData, gameConfig } = req.body;

        if (!players || !killsData || !gameConfig) {
            return res.status(400).json({ success: false, error: 'Dados incompletos.' });
        }

        await Player.deleteMany({});
        await Player.insertMany(players);

        await KillsData.deleteMany({});
        await KillsData.insertMany(killsData);

        await GameConfig.deleteMany({});
        await GameConfig.create(gameConfig);

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar leaderboard:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
});
