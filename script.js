// Dados dos jogadores do Camp Warzone reorganizados (posições 1-9 e 19 renumerada para 10)
let playersData = [
    { position: 1, name: "BI", team: "HISOKA SHIFTY", score: 0, logo: "🌪️", teamId: 1 },
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

// Dados do ranking de kills
let killsData = [
    { position: 1, name: "DEVO SWAY TAPPA", kills: 0 },
    { position: 2, name: "CLOWHN DONJAY SHERRO", kills: 0 },
    { position: 3, name: "JOEWO OAKBOI ZLANER", kills: 0 },
    { position: 4, name: "CLIMZZY FLANKED JTECC", kills: 0 },
    { position: 5, name: "JAWAD ROBSTAR SHOWSTOPPER", kills: 0 }
];

// Configurações do jogo
let gameConfig = {
    currentGame: 5,
    totalGames: 6,
    gameStatus: "STARTING SOON",
    isLive: false,
    editMode: false,
    victoryPointThreshold: 100,
    isAuthenticated: false,
    autoSaveEnabled: true,
    autoSaveInterval: 10000 // 10 segundos
};

// Configuração da API (funciona apenas se o servidor estiver rodando)
const API_BASE_URL = "https://warzone-da3e.onrender.com/api";
let authToken = null;

// Senha de acesso
const ACCESS_PASSWORD = "929424";

// Variáveis de edição
let selectedPlayerIndex = -1;
let editingElement = null;
let controlsExpanded = false;
let autoSaveTimer = null;

// Função para inicializar a página
async function initializePage() {
    updateGameStatus();
    renderLeaderboard();
    renderKillsRanking();
    addInteractiveEffects();
    addKeyboardControls();
    initializeControls();
    initializeAuth();
    optimizeForMobile();
    
    // Tentar carregar dados da API (se disponível)
    await loadDataFromAPI();
    
    // Se não conseguir carregar da API, carregar do localStorage
    if (!gameConfig.isAuthenticated) {
        loadDataFromStorage();
    }
    
    // Iniciar autosave apenas se autenticado
    if (gameConfig.isAuthenticated) {
        startAutoSave();
    }
}

// Função para ordenar jogadores por pontuação (maior pontuação = posição melhor)
function sortPlayersByScore() {
    // Criar uma cópia dos dados para ordenação
    const sortedPlayers = [...playersData].sort((a, b) => b.score - a.score);
    
    // Atualizar as posições baseado na ordenação
    sortedPlayers.forEach((player, index) => {
        player.position = index + 1;
    });
    
    // Atualizar o array principal
    playersData = sortedPlayers;
}

// Função para ordenar ranking de kills
function sortKillsByCount() {
    killsData.sort((a, b) => b.kills - a.kills);
    killsData.forEach((player, index) => {
        player.position = index + 1;
    });
}

// Funções da API (com fallback para localStorage)

// Fazer requisição para a API
async function apiRequest(endpoint, options = {}) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            ...options
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

// Autenticar com a API ou localmente
async function authenticateWithAPI(password) {
    // Verificar senha localmente primeiro
    if (password === ACCESS_PASSWORD) {
        try {
            // Tentar autenticar com a API se disponível
            const response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ password })
            });

            if (response.success) {
                authToken = response.token;
                gameConfig.isAuthenticated = true;
                localStorage.setItem('valorant_auth_token', authToken);
                return true;
            }
        } catch (error) {
            // Se a API não estiver disponível, autenticar localmente
            console.log('API não disponível, usando autenticação local');
            gameConfig.isAuthenticated = true;
            localStorage.setItem('valorant_local_auth', 'true');
            return true;
        }
    }
    return false;
}

// Carregar dados da API ou localStorage
async function loadDataFromAPI() {
    try {
        const response = await apiRequest('/leaderboard');
        
        if (response.success && response.data) {
            // Atualizar dados dos jogadores
            if (response.data.players && Array.isArray(response.data.players)) {
                playersData = response.data.players;
            }
            
            // Atualizar dados de kills se existirem
            if (response.data.killsData && Array.isArray(response.data.killsData)) {
                killsData = response.data.killsData;
            }
            
            // Atualizar configurações do jogo
            if (response.data.gameConfig) {
                Object.assign(gameConfig, response.data.gameConfig);
            }
            
            // Ordenar dados
            sortPlayersByScore();
            sortKillsByCount();
            
            // Re-renderizar com dados carregados
            updateGameStatus();
            renderLeaderboard();
            renderKillsRanking();
            
            showToast('Dados carregados da API!');
        }
    } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
        showToast('Usando dados locais (API indisponível)');
        loadDataFromStorage();
    }
}

// Salvar dados na API ou localStorage
async function saveDataToAPI() {
    if (!gameConfig.isAuthenticated) {
        showToast('Autenticação necessária para salvar!');
        return false;
    }

    try {
        if (authToken) {
            // Tentar salvar na API
            const response = await apiRequest('/leaderboard/save', {
                method: 'POST',
                body: JSON.stringify({
                    players: playersData,
                    killsData: killsData,
                    gameConfig: gameConfig
                })
            });

            if (response.success) {
                showAutoSaveIndicator();
                return true;
            }
        }
    } catch (error) {
        console.error('Erro ao salvar na API:', error);
    }
    
    // Fallback para localStorage
    return saveDataToStorage();
}

// Verificar token salvo no localStorage
function checkSavedToken() {
    const savedToken = localStorage.getItem('valorant_auth_token');
    const localAuth = localStorage.getItem('valorant_local_auth');
    
    if (savedToken) {
        authToken = savedToken;
        // Verificar se o token ainda é válido fazendo uma requisição de teste
        apiRequest('/leaderboard')
            .then(() => {
                gameConfig.isAuthenticated = true;
                gameConfig.editMode = true;
                document.body.classList.add('edit-mode');
                startAutoSave();
                showToast('Sessão restaurada!');
            })
            .catch(() => {
                // Token inválido, remover
                localStorage.removeItem('valorant_auth_token');
                authToken = null;
                gameConfig.isAuthenticated = false;
            });
    } else if (localAuth === 'true') {
        // Autenticação local
        gameConfig.isAuthenticated = true;
        gameConfig.editMode = true;
        document.body.classList.add('edit-mode');
        startAutoSave();
        showToast('Sessão local restaurada!');
    }
}

// Inicializar sistema de autenticação
function initializeAuth() {
    const authModal = document.getElementById('authModal');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const authError = document.getElementById('authError');

    // Verificar token salvo
    checkSavedToken();

    // Event listeners para autenticação
    loginBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        
        if (await authenticateWithAPI(password)) {
            authModal.classList.remove('active');
            gameConfig.editMode = true;
            document.body.classList.add('edit-mode');
            showToast('Acesso autorizado! Modo de edição ativado.');
            authError.textContent = '';
            passwordInput.value = '';
            startAutoSave();
        } else {
            authError.textContent = 'Senha incorreta!';
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    cancelBtn.addEventListener('click', () => {
        authModal.classList.remove('active');
        authError.textContent = '';
        passwordInput.value = '';
    });

    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        } else if (e.key === 'Escape') {
            cancelBtn.click();
        }
    });

    // Fechar modal clicando fora
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            cancelBtn.click();
        }
    });
}

// Mostrar modal de autenticação
function showAuthModal() {
    if (!gameConfig.isAuthenticated) {
        const authModal = document.getElementById('authModal');
        authModal.classList.add('active');
        document.getElementById('passwordInput').focus();
    }
}

// Sistema de autosave
function startAutoSave() {
    if (gameConfig.autoSaveEnabled && gameConfig.isAuthenticated) {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }
        
        autoSaveTimer = setInterval(async () => {
            if (gameConfig.isAuthenticated && gameConfig.editMode) {
                await saveDataToAPI();
            }
        }, gameConfig.autoSaveInterval);
    }
}

function showAutoSaveIndicator() {
    let indicator = document.querySelector('.auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.textContent = 'DADOS SALVOS';
        document.body.appendChild(indicator);
    }
    
    indicator.classList.add('show');
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// Funções de localStorage
function saveDataToStorage() {
    const data = {
        players: playersData,
        killsData: killsData,
        gameConfig: gameConfig,
        timestamp: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('valorant_leaderboard_data', JSON.stringify(data));
        showAutoSaveIndicator();
        return true;
    } catch (error) {
        console.error('Erro ao salvar dados localmente:', error);
        return false;
    }
}

function loadDataFromStorage() {
    try {
        const savedData = localStorage.getItem('valorant_leaderboard_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            if (data.players && Array.isArray(data.players)) {
                playersData = data.players;
            }
            
            if (data.killsData && Array.isArray(data.killsData)) {
                killsData = data.killsData;
            }
            
            if (data.gameConfig) {
                Object.assign(gameConfig, data.gameConfig);
            }
            
            sortPlayersByScore();
            sortKillsByCount();
            updateGameStatus();
            renderLeaderboard();
            renderKillsRanking();
            return true;
        }
    } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
        return false;
    }
    return false;
}

// Otimizações para mobile/iPhone
function optimizeForMobile() {
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.body.style.webkitOverflowScrolling = 'touch';
    
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            window.scrollTo(0, 0);
        }, 100);
    });
}

// Renderizar leaderboard
function renderLeaderboard() {
    const column = document.getElementById('leaderboardColumn');
    
    column.innerHTML = '';
    
    playersData.forEach((player, index) => {
        const playerRow = createPlayerRow(player, index);
        column.appendChild(playerRow);
    });
}

// Renderizar ranking de kills
function renderKillsRanking() {
    killsData.forEach((player, index) => {
        const killCard = document.querySelector(`.kill-card.position-${player.position}`);
        if (killCard) {
            const nameElement = killCard.querySelector('.kill-player-name');
            const countElement = killCard.querySelector('.kill-count');
            
            if (nameElement) nameElement.textContent = player.name;
            if (countElement) countElement.textContent = player.kills;
        }
    });
}

// Criar linha do jogador
function createPlayerRow(player, index) {
    const row = document.createElement('div');
    row.className = `player-row position-${player.position}`;
    row.dataset.playerIndex = index;
    
    row.innerHTML = `
        <div class="position-number">${player.position}</div>
        <div class="player-info">
            <div class="team-logo">${player.logo}</div>
            <div class="player-details">
                <div class="player-name editable" data-field="name">${player.name}</div>
                <div class="team-name editable" data-field="team">${player.team}</div>
            </div>
        </div>
        <div class="score-container">
            <div class="team-indicator team-${player.teamId}"></div>
            <div class="score editable" data-field="score">${player.score}</div>
        </div>
    `;
    
    return row;
}

// Atualizar status do jogo
function updateGameStatus() {
    const gameNumber = document.querySelector('.game-number');
    const gameStatusText = document.querySelector('.game-status-text');
    
    if (gameNumber) {
        gameNumber.textContent = `JOGO ${gameConfig.currentGame}/${gameConfig.totalGames}`;
    }
    
    if (gameStatusText) {
        gameStatusText.textContent = gameConfig.gameStatus;
        gameStatusText.style.color = gameConfig.isLive ? '#06ffa5' : '#ff006e';
    }
}

// Inicializar controles
function initializeControls() {
    const controlsToggle = document.getElementById('controlsToggle');
    const controlsContent = document.getElementById('controlsContent');
    
    controlsToggle.addEventListener('click', () => {
        controlsExpanded = !controlsExpanded;
        controlsToggle.classList.toggle('expanded', controlsExpanded);
        controlsContent.classList.toggle('expanded', controlsExpanded);
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.controls-panel-bottom-right') && controlsExpanded) {
            controlsExpanded = false;
            controlsToggle.classList.remove('expanded');
            controlsContent.classList.remove('expanded');
        }
    });
}

// Adicionar efeitos interativos
function addInteractiveEffects() {
    document.addEventListener('click', handleClick);
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

let touchStartTime = 0;
let touchStartTarget = null;

function handleTouchStart(event) {
    touchStartTime = Date.now();
    touchStartTarget = event.target;
}

function handleTouchEnd(event) {
    const touchDuration = Date.now() - touchStartTime;
    
    if (touchDuration < 300 && touchStartTarget === event.target) {
        const editableElement = event.target.closest('.editable');
        if (editableElement && gameConfig.editMode && gameConfig.isAuthenticated) {
            event.preventDefault();
            startEditing(editableElement);
        }
    }
}

function handleClick(event) {
    const playerRow = event.target.closest('.player-row');
    
    if (playerRow) {
        const playerIndex = parseInt(playerRow.dataset.playerIndex);
        selectPlayer(playerIndex);
    }
}

function handleDoubleClick(event) {
    const editableElement = event.target.closest('.editable');
    
    if (editableElement) {
        event.preventDefault();
        if (gameConfig.isAuthenticated && gameConfig.editMode) {
            startEditing(editableElement);
        } else {
            showAuthModal();
        }
    }
}

function selectPlayer(index) {
    clearAllSelections();
    selectedPlayerIndex = index;
    
    const playerRow = document.querySelector(`[data-player-index="${index}"]`);
    if (playerRow) {
        playerRow.classList.add('selected');
        showToast(`Jogador selecionado: ${playersData[index].name}`);
        
        if (window.innerWidth <= 768) {
            playerRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function clearAllSelections() {
    document.querySelectorAll('.player-row').forEach(row => {
        row.classList.remove('selected');
    });
    selectedPlayerIndex = -1;
}

function startEditing(element) {
    if (!gameConfig.isAuthenticated) {
        showAuthModal();
        return;
    }
    
    if (editingElement) {
        stopEditing();
    }
    
    editingElement = element;
    const originalValue = element.textContent;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.className = 'edit-input';
    input.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        color: #000;
        border: 2px solid #ff006e;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: inherit;
        font-weight: inherit;
        width: 100%;
        outline: none;
        font-size: 16px;
    `;
    
    element.style.display = 'none';
    element.parentNode.insertBefore(input, element.nextSibling);
    input.focus();
    input.select();
    
    input.addEventListener('blur', () => saveEdit(element, input));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit(element, input);
        } else if (e.key === 'Escape') {
            cancelEdit(element, input);
        }
    });
}

async function saveEdit(element, input) {
    const newValue = input.value.trim();
    const field = element.dataset.field;
    
    if (newValue) {
        const playerRow = element.closest('.player-row');
        const killCard = element.closest('.kill-card');
        
        if (playerRow) {
            const playerIndex = parseInt(playerRow.dataset.playerIndex);
            updatePlayerData(playerIndex, field, newValue);
        } else if (killCard) {
            updateKillsData(killCard, field, newValue);
        } else if (field === 'gameNumber' || field === 'gameStatus') {
            updateGameData(field, newValue);
        }
        
        element.textContent = newValue;
        showToast(`${field.toUpperCase()} atualizado: ${newValue}`);
        
        // Salvar dados
        await saveDataToAPI();
    }
    
    element.style.display = '';
    input.remove();
    editingElement = null;
}

function updatePlayerData(index, field, value) {
    if (field === 'name') {
        playersData[index].name = value.toUpperCase();
    } else if (field === 'team') {
        playersData[index].team = value.toUpperCase();
    } else if (field === 'score') {
        const scoreValue = parseFloat(value);
        if (!isNaN(scoreValue)) {
            playersData[index].score = scoreValue;
            checkVictoryCondition(playersData[index]);
            
            // Reordenar automaticamente por pontuação
            sortPlayersByScore();
            renderLeaderboard();
            
            // Reselecionar o jogador na nova posição
            const newIndex = playersData.findIndex(p => p.name === playersData[index].name);
            if (newIndex >= 0) {
                setTimeout(() => selectPlayer(newIndex), 100);
            }
        }
    }
}

function updateKillsData(killCard, field, value) {
    const position = parseInt(killCard.classList[1].split('-')[1]);
    const killPlayer = killsData.find(p => p.position === position);
    
    if (killPlayer) {
        if (field.startsWith('killPlayer')) {
            killPlayer.name = value.toUpperCase();
        } else if (field.startsWith('killCount')) {
            const killValue = parseInt(value);
            if (!isNaN(killValue)) {
                killPlayer.kills = killValue;
                
                // Reordenar automaticamente por kills
                sortKillsByCount();
                renderKillsRanking();
            }
        }
    }
}

function updateGameData(field, value) {
    if (field === 'gameNumber') {
        gameConfig.currentGame = value;
    } else if (field === 'gameStatus') {
        gameConfig.gameStatus = value.toUpperCase();
    }
}

function checkVictoryCondition(player) {
    if (player.score >= gameConfig.victoryPointThreshold) {
        showVictoryAnimation(player.name);
        showToast(`${player.name} atingiu o PONTO DE VITÓRIA!`);
    }
}

function showVictoryAnimation(playerName) {
    const victoryContainer = document.getElementById('victoryAnimation');
    const championTeam = victoryContainer.querySelector('.champion-team');
    
    championTeam.textContent = playerName;
    victoryContainer.classList.add('active');
    
    setTimeout(() => {
        victoryContainer.classList.remove('active');
    }, 4000);
}

function cancelEdit(element, input) {
    element.style.display = '';
    input.remove();
    editingElement = null;
    showToast('Edição cancelada');
}

function stopEditing() {
    if (editingElement) {
        const input = editingElement.parentNode.querySelector('.edit-input');
        if (input) {
            cancelEdit(editingElement, input);
        }
    }
}

// Controles de teclado
function addKeyboardControls() {
    document.addEventListener('keydown', (event) => {
        if (editingElement) return;
        
        switch(event.key.toLowerCase()) {
            case 'r':
                if (gameConfig.isAuthenticated) {
                    resetAllScores();
                }
                break;
            case 'e':
                if (gameConfig.isAuthenticated) {
                    toggleEditMode();
                } else {
                    showAuthModal();
                }
                break;
            case 'l':
                if (gameConfig.isAuthenticated) {
                    toggleLiveMode();
                }
                break;
            case 'f':
                toggleFullscreen();
                break;
            case 's':
                if (gameConfig.isAuthenticated) {
                    saveDataToAPI();
                    showToast('Dados salvos manualmente!');
                }
                break;
            case 't':
                showTrophyAnimation();
                break;
            case 'a':
                if (gameConfig.isAuthenticated) {
                    addPointsToSelected(1);
                }
                break;
            case 'd':
                if (gameConfig.isAuthenticated) {
                    addPointsToSelected(-1);
                }
                break;
            case 'q':
                if (gameConfig.isAuthenticated) {
                    addPointsToSelected(5);
                }
                break;
            case 'w':
                if (gameConfig.isAuthenticated) {
                    addPointsToSelected(-5);
                }
                break;
            case 'arrowup':
                navigateSelection(-1);
                event.preventDefault();
                break;
            case 'arrowdown':
                navigateSelection(1);
                event.preventDefault();
                break;
            case 'escape':
                clearAllSelections();
                if (controlsExpanded) {
                    document.getElementById('controlsToggle').click();
                }
                break;
        }
    });
}

// Funções de controle
async function resetAllScores() {
    if (!gameConfig.isAuthenticated) {
        showAuthModal();
        return;
    }
    
    if (confirm('Tem certeza que deseja resetar todas as pontuações?')) {
        playersData.forEach(player => {
            player.score = 0;
        });
        
        killsData.forEach(player => {
            player.kills = 0;
        });
        
        sortPlayersByScore();
        sortKillsByCount();
        renderLeaderboard();
        renderKillsRanking();
        await saveDataToAPI();
        showToast('Todas as pontuações foram resetadas!');
    }
}

function toggleEditMode() {
    if (!gameConfig.isAuthenticated) {
        showAuthModal();
        return;
    }
    
    gameConfig.editMode = !gameConfig.editMode;
    document.body.classList.toggle('edit-mode', gameConfig.editMode);
    showToast(`Modo de edição ${gameConfig.editMode ? 'ATIVADO' : 'DESATIVADO'}`);
}

function toggleLiveMode() {
    if (!gameConfig.isAuthenticated) {
        showAuthModal();
        return;
    }
    
    gameConfig.isLive = !gameConfig.isLive;
    updateGameStatus();
    saveDataToAPI();
    showToast(`Modo live ${gameConfig.isLive ? 'ATIVADO' : 'DESATIVADO'}`);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            showToast('Erro ao entrar em tela cheia');
        });
    } else {
        document.exitFullscreen();
    }
}

function showTrophyAnimation() {
    const victoryContainer = document.getElementById('victoryAnimation');
    victoryContainer.classList.add('active');
    
    setTimeout(() => {
        victoryContainer.classList.remove('active');
    }, 3000);
}

async function addPointsToSelected(points) {
    if (!gameConfig.isAuthenticated) {
        showAuthModal();
        return;
    }
    
    if (selectedPlayerIndex >= 0) {
        playersData[selectedPlayerIndex].score += points;
        if (playersData[selectedPlayerIndex].score < 0) {
            playersData[selectedPlayerIndex].score = 0;
        }
        
        const player = playersData[selectedPlayerIndex];
        checkVictoryCondition(player);
        
        // Reordenar automaticamente por pontuação
        sortPlayersByScore();
        renderLeaderboard();
        
        // Reselecionar o jogador na nova posição
        const newIndex = playersData.findIndex(p => p.name === player.name);
        if (newIndex >= 0) {
            setTimeout(() => selectPlayer(newIndex), 100);
        }
        
        showToast(`${player.name}: ${points > 0 ? '+' : ''}${points} pontos (Total: ${player.score})`);
        
        // Salvar dados
        await saveDataToAPI();
    } else {
        showToast('Selecione um jogador primeiro!');
    }
}

function navigateSelection(direction) {
    const newIndex = selectedPlayerIndex + direction;
    
    if (newIndex >= 0 && newIndex < playersData.length) {
        selectPlayer(newIndex);
    } else if (newIndex < 0) {
        selectPlayer(playersData.length - 1);
    } else {
        selectPlayer(0);
    }
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', initializePage);

// Salvar dados antes de sair da página
window.addEventListener('beforeunload', async () => {
    if (gameConfig.isAuthenticated) {
        await saveDataToAPI();
    }
});

// Limpar timer de autosave ao sair
window.addEventListener('unload', () => {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
});

