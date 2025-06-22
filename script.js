// Script completo para o Campeonato Warzone
console.log("🚀 Warzone Championship Script Loading...");

// Configurações globais
const API_BASE = "";
const ADMIN_PASSWORD = "929424";
let adminMode = false;
let socket;
let currentTeams = [];
let currentKills = [];
let currentChampion = null;
let matchPointValue = 150; // Valor configurável do match point
let killsRankingTitle = "RANKING DE KILLS INDIVIDUAIS"; // Título padrão

// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", function() {
    console.log("📱 DOM loaded, initializing app...");
    initializeApp();
});

function initializeApp() {
    console.log("🔧 Setting up application...");
    setupEventListeners();
    loadInitialData();
    initializeSocket();
    
    // Verificar match point a cada 5 segundos
    setInterval(checkMatchPoint, 5000);
}

// Configuração do Socket.IO
function initializeSocket() {
    if (typeof io !== "undefined") {
        socket = io();
        
        socket.on("connect", () => {
            console.log("🔌 Socket connected");
        });
        
        socket.on("team-updated", (team) => {
            console.log("📡 Team updated via socket:", team);
            loadInitialData();
        });
        
        socket.on("team-added", (team) => {
            console.log("📡 Team added via socket:", team);
            loadInitialData();
        });
        
        socket.on("kill-added", (kill) => {
            console.log("📡 Kill added via socket:", kill);
            loadInitialData();
        });
        
        socket.on("ranking-updated", (teams) => {
            console.log("📡 Ranking updated via socket");
            loadInitialData();
        });
        
        socket.on("champion-set", (data) => {
            console.log("📡 Champion set via socket:", data);
            currentChampion = data.champion;
            showChampionAnnouncement(data.team);
            loadInitialData();
        });

        socket.on("champion-removed", (data) => {
            console.log("📡 Champion removed via socket:", data);
            currentChampion = null;
            hideChampionBanner();
            loadInitialData();
        });

        socket.on("settings-updated", (settings) => {
            console.log("📡 Settings updated via socket:", settings);
            if (settings.killsRankingTitle !== undefined) {
                killsRankingTitle = settings.killsRankingTitle;
                document.getElementById("killsRankingTitle").textContent = killsRankingTitle.toUpperCase();
                document.getElementById("killsRankingTitleInput").value = killsRankingTitle;
            }
        });
        
        socket.on("disconnect", () => {
            console.log("🔌 Socket disconnected");
        });
    }
}

// Carregamento inicial dos dados
async function loadInitialData() {
    try {
        console.log("📊 Loading initial data...");
        await Promise.all([
            loadTeams(),
            loadKills(),
            loadGameNumber(),
            loadChampion(),
            loadGlobalSettings()
        ]);
        console.log("✅ Data loaded successfully");
    } catch (error) {
        console.error("❌ Error loading data:", error);
        showError("Erro ao carregar dados. Verifique a conexão.");
    }
}

// Carregar equipas
async function loadTeams() {
    try {
        const response = await fetch(`${API_BASE}/api/teams`);
        if (!response.ok) throw new Error("Erro ao carregar equipas");
        
        const teams = await response.json();
        console.log("👥 Teams loaded:", teams.length);
        currentTeams = teams;
        displayTeams(teams);
        
        if (adminMode) {
            displayAdminTeams(teams);
        }
    } catch (error) {
        console.error("❌ Error loading teams:", error);
        displayTeams([]);
    }
}

// Carregar kills individuais
async function loadKills() {
    try {
        const response = await fetch(`${API_BASE}/api/kills`);
        if (!response.ok) throw new Error("Erro ao carregar kills");
        
        const kills = await response.json();
        console.log("💀 Kills loaded:", kills.length);
        currentKills = kills;
        displayKills(kills);
        
        if (adminMode) {
            displayAdminKills(kills);
        }
    } catch (error) {
        console.error("❌ Error loading kills:", error);
        displayKills([]);
    }
}

// Carregar número do jogo
async function loadGameNumber() {
    try {
        const response = await fetch(`${API_BASE}/api/game`);
        if (!response.ok) throw new Error("Erro ao carregar número do jogo");
        
        const gameData = await response.json();
        console.log("🎮 Game number loaded:", gameData);
        displayGameNumber(gameData);
    } catch (error) {
        console.error("❌ Error loading game number:", error);
        displayGameNumber({ current: 1, total: 10 });
    }
}

// Carregar campeão atual
async function loadChampion() {
    try {
        const response = await fetch(`${API_BASE}/api/champion/current`);
        if (response.ok) {
            const champion = await response.json();
            console.log("🏆 Champion loaded:", champion);
            currentChampion = champion;
            displayChampionBanner(champion);
        } else {
            currentChampion = null;
            hideChampionBanner();
        }
    } catch (error) {
        console.log("ℹ️ No champion set yet");
        currentChampion = null;
        hideChampionBanner();
    }
}

// Carregar configurações globais
async function loadGlobalSettings() {
    try {
        const response = await fetch(`${API_BASE}/api/settings`);
        if (!response.ok) throw new Error("Erro ao carregar configurações globais");
        
        const settings = await response.json();
        console.log("⚙️ Global settings loaded:", settings);
        
        if (settings.killsRankingTitle !== undefined) {
            killsRankingTitle = settings.killsRankingTitle;
            document.getElementById("killsRankingTitle").textContent = killsRankingTitle.toUpperCase();
            document.getElementById("killsRankingTitleInput").value = killsRankingTitle;
        }
    } catch (error) {
        console.error("❌ Error loading global settings:", error);
    }
}

// Verificar match point (valor configurável)
function checkMatchPoint() {
    if (currentTeams.length === 0) return;
    
    const matchPointTeams = currentTeams.filter(team => team.kills >= matchPointValue);
    
    matchPointTeams.forEach(team => {
        const teamCard = document.querySelector(`[data-team-id="${team._id}"]`);
        if (teamCard) {
            teamCard.classList.add("match-point");
            
            // Adicionar efeito de pulsação especial
            if (!teamCard.classList.contains("match-point-animation")) {
                teamCard.classList.add("match-point-animation");
                console.log(`🏆 Team ${team.name} reached match point (${matchPointValue} kills)!`);
            }
        }
    });
}

// Exibir equipas
function displayTeams(teams) {
    console.log("🖥️ Displaying teams:", teams.length);
    const teamsList = document.getElementById("teamsList");
    if (!teamsList) {
        console.error("❌ teamsList element not found");
        return;
    }
    
    if (teams.length === 0) {
        teamsList.innerHTML = "<div class=\"no-data\">Nenhuma equipa encontrada</div>";
        return;
    }
    
    // Ordenar equipas por kills (descendente) e depois por posição
    teams.sort((a, b) => {
        if (b.kills !== a.kills) {
            return b.kills - a.kills;
        }
        return a.position - b.position;
    });
    
    teamsList.innerHTML = teams.map((team, index) => {
        const position = index + 1;
        const isMatchPoint = team.kills >= matchPointValue;
        const isChampion = currentChampion && currentChampion.teamId === team._id;
        const matchPointClass = isMatchPoint ? "match-point" : "";
        const championClass = isChampion ? "champion-team" : "";
        
        // Determina se o ícone deve ser exibido (apenas para posições > 15)
        const showIcon = position > 15;

        return `
            <div class="team-card fade-in ${matchPointClass} ${championClass}" data-position="${position}" data-team-id="${team._id}">
                <div class="team-left">
                    <div class="team-position">${position}</div>
                    ${showIcon ? `<div class="team-icon">${isChampion ? "👑" : "🎯"}</div>` : ""}
                    <div class="team-info">
                        <div class="team-name">${team.name}</div>
                        <div class="team-tag">${team.tag}</div>
                    </div>
                </div>
                <div class="team-right">
                    <div class="team-status ${team.status === "online" ? "pulse" : ""}"></div>
                    <div class="team-kills ${isMatchPoint ? "match-point-kills" : ""} ${isChampion ? "champion-kills" : ""}">${team.kills}</div>
                    ${isMatchPoint ? `<div class="match-point-indicator">🏆 MATCH POINT (${matchPointValue})</div>` : ""}
                    ${isChampion ? "<div class=\"champion-indicator\">👑 CAMPEÃ</div>" : ""}
                </div>
            </div>
        `;
    }).join("");
    
    // Aplicar animações especiais
    setTimeout(() => {
        teams.forEach(team => {
            const teamCard = document.querySelector(`[data-team-id="${team._id}"]`);
            if (teamCard) {
                if (team.kills >= matchPointValue) {
                    teamCard.classList.add("match-point-animation");
                }
                if (currentChampion && currentChampion.teamId === team._id) {
                    teamCard.classList.add("champion-animation");
                }
            }
        });
    }, 100);
}

// Exibir kills individuais
function displayKills(kills) {
    console.log("🖥️ Displaying kills:", kills.length);
    const killsRanking = document.getElementById("killsRanking");
    if (!killsRanking) {
        console.error("❌ killsRanking element not found");
        return;
    }
    
    if (kills.length === 0) {
        killsRanking.innerHTML = "<div class=\"no-data\">Nenhum kill individual encontrado</div>";
        return;
    }
    
    // Ordenar kills por número de kills (descendente)
    kills.sort((a, b) => b.kills - a.kills);
    
    killsRanking.innerHTML = kills.map((kill, index) => {
        const position = index + 1;
        return `
            <div class="kill-card fade-in">
                <div class="kill-position">${position}</div>
                <div class="kill-icon">💀</div>
                <div class="kill-player">${kill.player}</div>
                <div class="kill-count">${kill.kills}</div>
                <div class="kill-team">${kill.team}</div>
            </div>
        `;
    }).join("");
}

// Exibir número do jogo
function displayGameNumber(gameData) {
    console.log("🎮 Displaying game number:", gameData);
    const gameLabel = document.getElementById("gameLabel");
    if (gameLabel) {
        gameLabel.textContent = `JOGO ${gameData.current}/${gameData.total}`;
    }
}

// Exibir banner do campeão
function displayChampionBanner(champion) {
    let banner = document.getElementById("championBanner");
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "championBanner";
        banner.className = "champion-banner";
        document.body.appendChild(banner);
    }
    
    banner.innerHTML = `
        <div class="champion-content">
            <div class="champion-crown">👑</div>
            <div class="champion-text">
                <h2>CAMPEÃ DO JOGO ${champion.gameNumber}</h2>
                <h3>${champion.teamName} (${champion.teamTag})</h3>
                <p>${champion.finalKills} kills finais</p>
            </div>
            <div class="champion-close" onclick="hideChampionBanner()">×</div>
        </div>
    `;
    
    banner.style.display = "flex";
}

// Esconder banner do campeão
function hideChampionBanner() {
    const banner = document.getElementById("championBanner");
    if (banner) {
        banner.style.display = "none";
    }
}

// Mostrar anúncio de campeão
function showChampionAnnouncement(team) {
    // Criar overlay de anúncio
    const overlay = document.createElement("div");
    overlay.className = "champion-announcement-overlay";
    overlay.innerHTML = `
        <div class="champion-announcement">
            <div class="champion-fireworks">🎆🎆🎆</div>
            <h1>🏆 TEMOS UMA CAMPEÃ! 🏆</h1>
            <h2>${team.name}</h2>
            <h3>(${team.tag})</h3>
            <p>Com ${team.kills} kills!</p>
            <div class="champion-fireworks">🎆🎆🎆</div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 5000);
}

// Configurar event listeners
function setupEventListeners() {
    console.log("🎛️ Setting up event listeners...");
    
    // Botão de configurações
    const settingsIcon = document.getElementById("settingsIcon");
    if (settingsIcon) {
        settingsIcon.addEventListener("click", showPasswordModal);
    }
    
    // Modal de password
    const closePasswordModal = document.getElementById("closePasswordModal");
    if (closePasswordModal) {
        closePasswordModal.addEventListener("click", hidePasswordModal);
    }
    
    const passwordInput = document.getElementById("passwordInput");
    if (passwordInput) {
        passwordInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                checkPassword();
            }
        });
    }
    
    // Fechar painel admin
    const closeAdminPanel = document.getElementById("closeAdminPanel");
    if (closeAdminPanel) {
        closeAdminPanel.addEventListener("click", closeAdmin);
    }
    
    // BOTÕES DO PAINEL ADMIN
    const addTeamBtn = document.getElementById("addTeamBtn");
    if (addTeamBtn) {
        addTeamBtn.addEventListener("click", function(e) {
            e.preventDefault();
            addTeam();
        });
    }
    
    const addKillBtn = document.getElementById("addKillBtn");
    if (addKillBtn) {
        addKillBtn.addEventListener("click", function(e) {
            e.preventDefault();
            addIndividualKill();
        });
    }
    
    const updateGameBtn = document.getElementById("updateGameBtn");
    if (updateGameBtn) {
        updateGameBtn.addEventListener("click", function(e) {
            e.preventDefault();
            updateGameNumber();
        });
    }
    
    const refreshDataBtn = document.getElementById("refreshDataBtn");
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener("click", function(e) {
            e.preventDefault();
            loadInitialData();
        });
    }
    
    const updateRankingBtn = document.getElementById("updateRankingBtn");
    if (updateRankingBtn) {
        updateRankingBtn.addEventListener("click", function(e) {
            e.preventDefault();
            updateRanking();
        });
    }
    
    const editModeBtn = document.getElementById("editModeBtn");
    if (editModeBtn) {
        editModeBtn.addEventListener("click", function(e) {
            e.preventDefault();
            toggleTeamManagement();
        });
    }

    // NOVOS BOTÕES
    const updateMatchPointBtn = document.getElementById("updateMatchPointBtn");
    if (updateMatchPointBtn) {
        updateMatchPointBtn.addEventListener("click", function(e) {
            e.preventDefault();
            updateMatchPoint();
        });
    }

    const updateKillsRankingTitleBtn = document.getElementById("updateKillsRankingTitleBtn");
    if (updateKillsRankingTitleBtn) {
        updateKillsRankingTitleBtn.addEventListener("click", function(e) {
            e.preventDefault();
            updateKillsRankingTitle();
        });
    }

    const clearChampionBtn = document.getElementById("clearChampionBtn");
    if (clearChampionBtn) {
        clearChampionBtn.addEventListener("click", function(e) {
            e.preventDefault();
            clearCurrentChampion();
        });
    }

    // Botões dinâmicos
    const adminPanel = document.getElementById("adminPanel");
    if (adminPanel) {
        adminPanel.addEventListener("click", async function(event) {
            event.preventDefault();
            
            if (event.target.classList.contains("edit-team-btn")) {
                const teamId = event.target.dataset.id;
                await editTeamPrompt(teamId);
            } else if (event.target.classList.contains("delete-team-btn")) {
                const teamId = event.target.dataset.id;
                await deleteTeam(teamId);
            } else if (event.target.classList.contains("edit-kill-btn")) {
                const killId = event.target.dataset.id;
                await editKillPrompt(killId);
            } else if (event.target.classList.contains("delete-kill-btn")) {
                const killId = event.target.dataset.id;
                await deleteKill(killId);
            } else if (event.target.classList.contains("set-winner-btn")) {
                const teamId = event.target.dataset.id;
                await setChampionTeam(teamId);
            }
        });
    }
}

// NOVA FUNÇÃO: Apagar o campeão do jogo atual
async function clearCurrentChampion() {
    const confirmed = confirm("Tem certeza que deseja apagar o campeão do jogo atual?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/api/champion/current`, {
            method: "DELETE",
            headers: {
                "x-admin-password": ADMIN_PASSWORD
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao apagar campeão atual");
        }

        const result = await response.json();
        showSuccess(result.message);
        
        // Recarregar dados para remover o banner
        await loadInitialData();
        hideChampionBanner(); // Garante que o banner seja escondido imediatamente

    } catch (error) {
        console.error("❌ Error clearing current champion:", error);
        showError("Erro ao apagar campeão atual: " + error.message);
    }
}

// NOVA FUNÇÃO: Atualizar valor do match point
function updateMatchPoint() {
    const matchPointInput = document.getElementById("matchPointValue");
    if (!matchPointInput) {
        showError("Campo de match point não encontrado!");
        return;
    }
    
    const newValue = parseInt(matchPointInput.value);
    if (isNaN(newValue) || newValue < 1) {
        showError("Por favor, insira um valor válido para o match point (mínimo 1).");
        return;
    }
    
    matchPointValue = newValue;
    showSuccess(`Match Point atualizado para: ${matchPointValue}`);
    checkMatchPoint(); // Re-verificar match point com o novo valor
}

// NOVA FUNÇÃO: Atualizar título do ranking de kills
async function updateKillsRankingTitle() {
    const killsRankingTitleInput = document.getElementById("killsRankingTitleInput");
    const killsRankingTitleDisplay = document.getElementById("killsRankingTitle");

    if (!killsRankingTitleInput || !killsRankingTitleDisplay) {
        showError("Elementos de título do ranking de kills não encontrados!");
        return;
    }

    const newTitle = killsRankingTitleInput.value.trim();
    if (newTitle === "") {
        showError("O título do ranking de kills não pode estar vazio.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/settings`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-admin-password": ADMIN_PASSWORD
            },
            body: JSON.stringify({ name: "killsRankingTitle", value: newTitle })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao atualizar título do ranking de kills");
        }

        const updatedSetting = await response.json();
        killsRankingTitle = updatedSetting.value;
        killsRankingTitleDisplay.textContent = killsRankingTitle.toUpperCase();
        showSuccess("Título do Ranking de Kills atualizado e sincronizado!");
    } catch (error) {
        console.error("❌ Error updating kills ranking title:", error);
        showError("Erro ao atualizar título do ranking de kills: " + error.message);
    }
}

// Funções do painel administrativo
function showPasswordModal() {
    document.getElementById("passwordModal").style.display = "flex";
    document.getElementById("passwordInput").value = "";
    document.getElementById("passwordError").textContent = "";
}

function hidePasswordModal() {
    document.getElementById("passwordModal").style.display = "none";
}

function checkPassword() {
    const password = document.getElementById("passwordInput").value;
    const passwordError = document.getElementById("passwordError");
    
    if (password === ADMIN_PASSWORD) {
        adminMode = true;
        hidePasswordModal();
        showAdminPanel();
        loadInitialData(); // Recarregar dados para mostrar opções de admin
    } else {
        passwordError.textContent = "Senha incorreta.";
    }
}

function showAdminPanel() {
    document.getElementById("adminPanel").style.display = "flex";
}

function closeAdmin() {
    adminMode = false;
    document.getElementById("adminPanel").style.display = "none";
    loadInitialData(); // Recarregar dados para esconder opções de admin
}

async function addTeam() {
    const teamNameInput = document.getElementById("teamName");
    const teamTagInput = document.getElementById("teamTag");
    const teamKillsInput = document.getElementById("teamKills");

    const name = teamNameInput.value.trim();
    const tag = teamTagInput.value.trim();
    const kills = parseInt(teamKillsInput.value) || 0;

    if (!name || !tag) {
        showError("Nome e Tag da equipe são obrigatórios.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/teams`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-password": ADMIN_PASSWORD
            },
            body: JSON.stringify({ name, tag, kills })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao adicionar equipe");
        }

        const newTeam = await response.json();
        showSuccess(`Equipe ${newTeam.name} adicionada com sucesso!`);
        teamNameInput.value = "";
        teamTagInput.value = "";
        teamKillsInput.value = "0";
        loadInitialData();
    } catch (error) {
        console.error("❌ Error adding team:", error);
        showError("Erro ao adicionar equipe: " + error.message);
    }
}

async function addIndividualKill() {
    const playerNameInput = document.getElementById("playerName");
    const playerTeamInput = document.getElementById("playerTeam");

    const player = playerNameInput.value.trim();
    const team = playerTeamInput.value.trim();

    if (!player || !team) {
        showError("Nome do jogador e equipe são obrigatórios.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/kills`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-password": ADMIN_PASSWORD
            },
            body: JSON.stringify({ player, team })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao adicionar kill individual");
        }

        const newKill = await response.json();
        showSuccess(`Kill para ${newKill.player} (${newKill.team}) adicionado!`);
        playerNameInput.value = "";
        playerTeamInput.value = "";
        loadInitialData();
    } catch (error) {
        console.error("❌ Error adding individual kill:", error);
        showError("Erro ao adicionar kill individual: " + error.message);
    }
}

async function updateGameNumber() {
    const gameNumberInput = document.getElementById("gameNumber");
    const gameNumberText = gameNumberInput.value.trim();

    if (!gameNumberText.includes("/")) {
        showError("Formato do número do jogo inválido. Use: atual/total (ex: 1/10).");
        return;
    }

    const [currentStr, totalStr] = gameNumberText.split("/");
    const current = parseInt(currentStr);
    const total = parseInt(totalStr);

    if (isNaN(current) || isNaN(total) || current < 1 || total < 1 || current > total) {
        showError("Números de jogo inválidos. Certifique-se de que são números positivos e atual <= total.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/game`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-admin-password": ADMIN_PASSWORD
            },
            body: JSON.stringify({ current, total })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao atualizar número do jogo");
        }

        const updatedGame = await response.json();
        showSuccess(`Número do jogo atualizado para ${updatedGame.current}/${updatedGame.total}!`);
        loadInitialData();
    } catch (error) {
        console.error("❌ Error updating game number:", error);
        showError("Erro ao atualizar número do jogo: " + error.message);
    }
}

async function updateRanking() {
    try {
        const response = await fetch(`${API_BASE}/api/teams/ranking`, {
            method: "PUT",
            headers: {
                "x-admin-password": ADMIN_PASSWORD
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao atualizar ranking");
        }

        showSuccess("Ranking de equipes atualizado com sucesso!");
        loadInitialData();
    } catch (error) {
        console.error("❌ Error updating ranking:", error);
        showError("Erro ao atualizar ranking: " + error.message);
    }
}

function displayAdminTeams(teams) {
    const adminTeamsList = document.getElementById("adminTeamsList");
    if (!adminTeamsList) return;

    adminTeamsList.innerHTML = teams.map(team => `
        <li>
            ${team.name} (${team.tag}) - Kills: ${team.kills} - Posição: ${team.position}
            <button class="edit-team-btn" data-id="${team._id}">Editar</button>
            <button class="delete-team-btn" data-id="${team._id}">Excluir</button>
            <button class="set-winner-btn" data-id="${team._id}">Definir como Campeã</button>
        </li>
    `).join("");
}

function displayAdminKills(kills) {
    const adminKillsList = document.getElementById("adminKillsList");
    if (!adminKillsList) return;

    adminKillsList.innerHTML = kills.map(kill => `
        <li>
            ${kill.player} (${kill.team}) - Kills: ${kill.kills}
            <button class="edit-kill-btn" data-id="${kill._id}">Editar</button>
            <button class="delete-kill-btn" data-id="${kill._id}">Excluir</button>
        </li>
    `).join("");
}

async function editTeamPrompt(teamId) {
    const team = currentTeams.find(t => t._id === teamId);
    if (!team) return;

    const newName = prompt("Novo nome da equipe:", team.name);
    if (newName === null) return; // Cancelado

    const newTag = prompt("Nova tag da equipe:", team.tag);
    if (newTag === null) return; // Cancelado

    const newKills = prompt("Novos kills:", team.kills);
    if (newKills === null) return; // Cancelado

    try {
        const response = await fetch(`${API_BASE}/api/teams/${teamId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-admin-password": ADMIN_PASSWORD
            },
            body: JSON.stringify({ name: newName, tag: newTag, kills: parseInt(newKills) })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao editar equipe");
        }

        showSuccess("Equipe atualizada com sucesso!");
        loadInitialData();
    } catch (error) {
        console.error("❌ Error editing team:", error);
        showError("Erro ao editar equipe: " + error.message);
    }
}

async function deleteTeam(teamId) {
    const confirmed = confirm("Tem certeza que deseja excluir esta equipe?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/api/teams/${teamId}`, {
            method: "DELETE",
            headers: {
                "x-admin-password": ADMIN_PASSWORD
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao excluir equipe");
        }

        showSuccess("Equipe excluída com sucesso!");
        loadInitialData();
    } catch (error) {
        console.error("❌ Error deleting team:", error);
        showError("Erro ao excluir equipe: " + error.message);
    }
}

async function editKillPrompt(killId) {
    const kill = currentKills.find(k => k._id === killId);
    if (!kill) return;

    const newPlayer = prompt("Novo nome do jogador:", kill.player);
    if (newPlayer === null) return;

    const newTeam = prompt("Nova equipe do jogador:", kill.team);
    if (newTeam === null) return;

    const newKills = prompt("Novos kills:", kill.kills);
    if (newKills === null) return;

    try {
        const response = await fetch(`${API_BASE}/api/kills/${killId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-admin-password": ADMIN_PASSWORD
            },
            body: JSON.stringify({ player: newPlayer, team: newTeam, kills: parseInt(newKills) })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao editar kill individual");
        }

        showSuccess("Kill individual atualizado com sucesso!");
        loadInitialData();
    } catch (error) {
        console.error("❌ Error editing individual kill:", error);
        showError("Erro ao editar kill individual: " + error.message);
    }
}

async function deleteKill(killId) {
    const confirmed = confirm("Tem certeza que deseja excluir este kill individual?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/api/kills/${killId}`, {
            method: "DELETE",
            headers: {
                "x-admin-password": ADMIN_PASSWORD
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao excluir kill individual");
        }

        showSuccess("Kill individual excluído com sucesso!");
        loadInitialData();
    } catch (error) {
        console.error("❌ Error deleting individual kill:", error);
        showError("Erro ao excluir kill individual: " + error.message);
    }
}

async function setChampionTeam(teamId) {
    const confirmed = confirm("Tem certeza que deseja definir esta equipe como a campeã do jogo atual?");
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/api/champion`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-password": ADMIN_PASSWORD
            },
            body: JSON.stringify({ teamId: teamId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao definir campeão");
        }

        showSuccess("Equipe definida como campeã com sucesso!");
        loadInitialData();
    } catch (error) {
        console.error("❌ Error setting champion:", error);
        showError("Erro ao definir campeão: " + error.message);
    }
}

// Função para alternar a visibilidade da gestão de equipes
function toggleTeamManagement() {
    const adminTeamsList = document.getElementById("adminTeamsList");
    if (adminTeamsList) {
        if (adminTeamsList.style.display === "none" || adminTeamsList.style.display === "") {
            adminTeamsList.style.display = "block";
        } else {
            adminTeamsList.style.display = "none";
        }
    }
}

// Funções de feedback para o usuário
function showSuccess(message) {
    alert("Sucesso: " + message);
}

function showError(message) {
    alert("Erro: " + message);
}


