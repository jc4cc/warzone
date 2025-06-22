// Script completo para o Campeonato Warzone
console.log('🚀 Warzone Championship Script Loading...');

// Configurações globais
const API_BASE = 'https://warzone-kzi5.onrender.com';
const ADMIN_PASSWORD = '929424';
let adminMode = false;
let socket;
let currentTeams = [];
let currentKills = [];
let currentChampion = null;
let matchPointValue = 150; // Valor configurável do match point

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM loaded, initializing app...');
    initializeApp();
});

function initializeApp() {
    console.log('🔧 Setting up application...');
    setupEventListeners();
    loadInitialData();
    initializeSocket();
    
    // Verificar match point a cada 5 segundos
    setInterval(checkMatchPoint, 5000);
}

// Configuração do Socket.IO
function initializeSocket() {
    if (typeof io !== 'undefined') {
        socket = io();
        
        socket.on('connect', () => {
            console.log('🔌 Socket connected');
        });
        
        socket.on('team-updated', (team) => {
            console.log('📡 Team updated via socket:', team);
            loadInitialData();
        });
        
        socket.on('team-added', (team) => {
            console.log('📡 Team added via socket:', team);
            loadInitialData();
        });
        
        socket.on('kill-added', (kill) => {
            console.log('📡 Kill added via socket:', kill);
            loadInitialData();
        });
        
        socket.on('ranking-updated', (teams) => {
            console.log('📡 Ranking updated via socket');
            loadInitialData();
        });
        
        socket.on('champion-set', (data) => {
            console.log('📡 Champion set via socket:', data);
            currentChampion = data.champion;
            showChampionAnnouncement(data.team);
            loadInitialData();
        });
        
        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
        });
    }
}

// Carregamento inicial dos dados
async function loadInitialData() {
    try {
        console.log('📊 Loading initial data...');
        await Promise.all([
            loadTeams(),
            loadKills(),
            loadGameNumber(),
            loadChampion()
        ]);
        console.log('✅ Data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showError('Erro ao carregar dados. Verifique a conexão.');
    }
}

// Carregar equipas
async function loadTeams() {
    try {
        const response = await fetch(`${API_BASE}/api/teams`);
        if (!response.ok) throw new Error('Erro ao carregar equipas');
        
        const teams = await response.json();
        console.log('👥 Teams loaded:', teams.length);
        currentTeams = teams;
        displayTeams(teams);
        
        if (adminMode) {
            displayAdminTeams(teams);
        }
    } catch (error) {
        console.error('❌ Error loading teams:', error);
        displayTeams([]);
    }
}

// Carregar kills individuais
async function loadKills() {
    try {
        const response = await fetch(`${API_BASE}/api/kills`);
        if (!response.ok) throw new Error('Erro ao carregar kills');
        
        const kills = await response.json();
        console.log('💀 Kills loaded:', kills.length);
        currentKills = kills;
        displayKills(kills);
        
        if (adminMode) {
            displayAdminKills(kills);
        }
    } catch (error) {
        console.error('❌ Error loading kills:', error);
        displayKills([]);
    }
}

// Carregar número do jogo
async function loadGameNumber() {
    try {
        const response = await fetch(`${API_BASE}/api/game`);
        if (!response.ok) throw new Error('Erro ao carregar número do jogo');
        
        const gameData = await response.json();
        console.log('🎮 Game number loaded:', gameData);
        displayGameNumber(gameData);
    } catch (error) {
        console.error('❌ Error loading game number:', error);
        displayGameNumber({ current: 1, total: 10 });
    }
}

// Carregar campeão atual
async function loadChampion() {
    try {
        const response = await fetch(`${API_BASE}/api/champion`);
        if (response.ok) {
            const champion = await response.json();
            console.log('🏆 Champion loaded:', champion);
            currentChampion = champion;
            displayChampionBanner(champion);
        } else {
            currentChampion = null;
            hideChampionBanner();
        }
    } catch (error) {
        console.log('ℹ️ No champion set yet');
        currentChampion = null;
        hideChampionBanner();
    }
}

// Verificar match point (valor configurável)
function checkMatchPoint() {
    if (currentTeams.length === 0) return;
    
    const matchPointTeams = currentTeams.filter(team => team.kills >= matchPointValue);
    
    matchPointTeams.forEach(team => {
        const teamCard = document.querySelector(`[data-team-id="${team._id}"]`);
        if (teamCard) {
            teamCard.classList.add('match-point');
            
            // Adicionar efeito de pulsação especial
            if (!teamCard.classList.contains('match-point-animation')) {
                teamCard.classList.add('match-point-animation');
                console.log(`🏆 Team ${team.name} reached match point (${matchPointValue} kills)!`);
            }
        }
    });
}

// Exibir equipas
function displayTeams(teams) {
    console.log('🖥️ Displaying teams:', teams.length);
    const teamsList = document.getElementById('teamsList');
    if (!teamsList) {
        console.error('❌ teamsList element not found');
        return;
    }
    
    if (teams.length === 0) {
        teamsList.innerHTML = '<div class="no-data">Nenhuma equipa encontrada</div>';
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
        const matchPointClass = isMatchPoint ? 'match-point' : '';
        const championClass = isChampion ? 'champion-team' : '';
        
        return `
            <div class="team-card fade-in ${matchPointClass} ${championClass}" data-position="${position}" data-team-id="${team._id}">
                <div class="team-left">
                    <div class="team-position">${position}</div>
                    <div class="team-icon">${isChampion ? '👑' : '🎯'}</div>
                    <div class="team-info">
                        <div class="team-name">${team.name}</div>
                        <div class="team-tag">${team.tag}</div>
                    </div>
                </div>
                <div class="team-right">
                    <div class="team-status ${team.status === 'online' ? 'pulse' : ''}"></div>
                    <div class="team-kills ${isMatchPoint ? 'match-point-kills' : ''} ${isChampion ? 'champion-kills' : ''}">${team.kills}</div>
                    ${isMatchPoint ? `<div class="match-point-indicator">🏆 MATCH POINT (${matchPointValue})</div>` : ''}
                    ${isChampion ? '<div class="champion-indicator">👑 CAMPEÃ</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Aplicar animações especiais
    setTimeout(() => {
        teams.forEach(team => {
            const teamCard = document.querySelector(`[data-team-id="${team._id}"]`);
            if (teamCard) {
                if (team.kills >= matchPointValue) {
                    teamCard.classList.add('match-point-animation');
                }
                if (currentChampion && currentChampion.teamId === team._id) {
                    teamCard.classList.add('champion-animation');
                }
            }
        });
    }, 100);
}

// Exibir kills individuais
function displayKills(kills) {
    console.log('🖥️ Displaying kills:', kills.length);
    const killsRanking = document.getElementById('killsRanking');
    if (!killsRanking) {
        console.error('❌ killsRanking element not found');
        return;
    }
    
    if (kills.length === 0) {
        killsRanking.innerHTML = '<div class="no-data">Nenhum kill individual encontrado</div>';
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
    }).join('');
}

// Exibir número do jogo
function displayGameNumber(gameData) {
    console.log('🎮 Displaying game number:', gameData);
    const gameLabel = document.getElementById('gameLabel');
    if (gameLabel) {
        gameLabel.textContent = `JOGO ${gameData.current}/${gameData.total}`;
    }
}

// Exibir banner do campeão
function displayChampionBanner(champion) {
    let banner = document.getElementById('championBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'championBanner';
        banner.className = 'champion-banner';
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
    
    banner.style.display = 'flex';
}

// Esconder banner do campeão
function hideChampionBanner() {
    const banner = document.getElementById('championBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}

// Mostrar anúncio de campeão
function showChampionAnnouncement(team) {
    // Criar overlay de anúncio
    const overlay = document.createElement('div');
    overlay.className = 'champion-announcement-overlay';
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

// Configurar event listeners - CORRIGIDO
function setupEventListeners() {
    console.log('🎛️ Setting up event listeners...');
    
    // Botão de configurações
    const settingsIcon = document.getElementById('settingsIcon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', showPasswordModal);
    }
    
    // Modal de password
    const closePasswordModal = document.getElementById('closePasswordModal');
    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', hidePasswordModal);
    }
    
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    
    // Fechar painel admin
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', closeAdmin);
    }
    
    // BOTÕES DO PAINEL ADMIN - CORRIGIDOS
    const addTeamBtn = document.getElementById('addTeamBtn');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addTeam();
        });
    }
    
    const addKillBtn = document.getElementById('addKillBtn');
    if (addKillBtn) {
        addKillBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addIndividualKill();
        });
    }
    
    const updateGameBtn = document.getElementById('updateGameBtn');
    if (updateGameBtn) {
        updateGameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            updateGameNumber();
        });
    }
    
    const refreshDataBtn = document.getElementById('refreshDataBtn');
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadInitialData();
        });
    }
    
    const updateRankingBtn = document.getElementById('updateRankingBtn');
    if (updateRankingBtn) {
        updateRankingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            updateRanking();
        });
    }
    
    const editModeBtn = document.getElementById('editModeBtn');
    if (editModeBtn) {
        editModeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTeamManagement();
        });
    }

    // NOVOS BOTÕES
    const updateMatchPointBtn = document.getElementById('updateMatchPointBtn');
    if (updateMatchPointBtn) {
        updateMatchPointBtn.addEventListener('click', function(e) {
            e.preventDefault();
            updateMatchPoint();
        });
    }

    const updateKillsRankingTitleBtn = document.getElementById('updateKillsRankingTitleBtn');
    if (updateKillsRankingTitleBtn) {
        updateKillsRankingTitleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            updateKillsRankingTitle();
        });
    }

    // Botões dinâmicos
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.addEventListener('click', async function(event) {
            event.preventDefault();
            
            if (event.target.classList.contains('edit-team-btn')) {
                const teamId = event.target.dataset.id;
                await editTeamPrompt(teamId);
            } else if (event.target.classList.contains('delete-team-btn')) {
                const teamId = event.target.dataset.id;
                await deleteTeam(teamId);
            } else if (event.target.classList.contains('edit-kill-btn')) {
                const killId = event.target.dataset.id;
                await editKillPrompt(killId);
            } else if (event.target.classList.contains('delete-kill-btn')) {
                const killId = event.target.dataset.id;
                await deleteKill(killId);
            } else if (event.target.classList.contains('set-winner-btn')) {
                const teamId = event.target.dataset.id;
                await setChampionTeam(teamId);
            }
        });
    }
}

// NOVA FUNÇÃO: Atualizar valor do match point
function updateMatchPoint() {
    const matchPointInput = document.getElementById('matchPointValue');
    if (!matchPointInput) {
        showError('Campo de match point não encontrado!');
        return;
    }
    
    const newValue = parseInt(matchPointInput.value);
    if (isNaN(newValue) || newValue < 1) {
        showError('Por favor, insira um valor válido para o match point (mínimo 1).');
        return;
    }
    
    matchPointValue = newValue;
    showSuccess(`Match point atualizado para ${newValue} kills!`);
    
    // Recarregar equipas para aplicar novo match point
    displayTeams(currentTeams);
    
    console.log(`🎯 Match point updated to: ${matchPointValue}`);
}

// NOVA FUNÇÃO: Atualizar título do ranking de kills
function updateKillsRankingTitle() {
    const titleInput = document.getElementById('killsRankingTitleInput');
    const titleElement = document.getElementById('killsRankingTitle');
    
    if (!titleInput || !titleElement) {
        showError('Elementos de título não encontrados!');
        return;
    }
    
    const newTitle = titleInput.value.trim();
    if (!newTitle) {
        showError('Por favor, insira um título válido.');
        return;
    }
    
    titleElement.textContent = newTitle;
    showSuccess('Título do ranking atualizado com sucesso!');
    
    console.log(`📝 Kills ranking title updated to: ${newTitle}`);
}

// Mostrar modal de password
function showPasswordModal() {
    console.log('🔐 Showing password modal...');
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'flex';
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.focus();
        }
    }
}

// Esconder modal de password
function hidePasswordModal() {
    console.log('🔐 Hiding password modal...');
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.value = '';
    }
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Verificar password
function checkPassword() {
    console.log('🔐 Checking password...');
    const passwordInput = document.getElementById('passwordInput');
    const errorElement = document.getElementById('passwordError');
    
    if (!passwordInput) {
        console.error('❌ Password input not found');
        return;
    }
    
    const password = passwordInput.value;
    
    if (password === ADMIN_PASSWORD) {
        console.log('✅ Password correct, opening admin panel...');
        hidePasswordModal();
        showAdminPanel();
    } else {
        console.log('❌ Incorrect password');
        if (errorElement) {
            errorElement.textContent = 'Senha incorreta!';
        }
    }
    
    passwordInput.value = '';
}

// Mostrar painel admin
function showAdminPanel() {
    console.log('⚙️ Showing admin panel...');
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'flex';
        adminMode = true;
        displayAdminTeams(currentTeams);
        displayAdminKills(currentKills);
        
        // Preencher valores atuais nos campos
        const matchPointInput = document.getElementById('matchPointValue');
        if (matchPointInput) {
            matchPointInput.value = matchPointValue;
        }
        
        const titleInput = document.getElementById('killsRankingTitleInput');
        const titleElement = document.getElementById('killsRankingTitle');
        if (titleInput && titleElement) {
            titleInput.value = titleElement.textContent;
        }
    }
}

// Fechar painel admin
function closeAdmin() {
    console.log('⚙️ Closing admin panel...');
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'none';
        adminMode = false;
    }
}

// Adicionar equipa
async function addTeam() {
    const name = document.getElementById('teamName').value.trim();
    const tag = document.getElementById('teamTag').value.trim();
    const kills = parseInt(document.getElementById('teamKills').value) || 0;
    
    if (!name || !tag) {
        showError('Por favor, preencha o nome e tag da equipa.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/teams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': ADMIN_PASSWORD
            },
            body: JSON.stringify({ name, tag, kills })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao adicionar equipa');
        }
        
        // Limpar campos
        document.getElementById('teamName').value = '';
        document.getElementById('teamTag').value = '';
        document.getElementById('teamKills').value = '';
        
        // Recarregar dados
        await loadInitialData();
        
        showSuccess('Equipa adicionada com sucesso!');
    } catch (error) {
        console.error('❌ Error adding team:', error);
        showError('Erro ao adicionar equipa: ' + error.message);
    }
}

// Adicionar kill individual
async function addIndividualKill() {
    const player = document.getElementById('playerName').value.trim();
    const team = document.getElementById('playerTeam').value.trim();
    
    if (!player || !team) {
        showError('Por favor, preencha o nome do jogador e equipa.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/kills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': ADMIN_PASSWORD
            },
            body: JSON.stringify({ player, team })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao adicionar kill');
        }
        
        // Limpar campos
        document.getElementById('playerName').value = '';
        document.getElementById('playerTeam').value = '';
        
        // Recarregar dados
        await loadInitialData();
        
        showSuccess('Kill adicionado com sucesso!');
    } catch (error) {
        console.error('❌ Error adding kill:', error);
        showError('Erro ao adicionar kill: ' + error.message);
    }
}

// Atualizar número do jogo
async function updateGameNumber() {
    const gameInput = document.getElementById('gameNumber').value.trim();
    
    if (!gameInput) {
        showError('Por favor, insira o número do jogo (ex: 1/10).');
        return;
    }
    
    const parts = gameInput.split('/');
    if (parts.length !== 2) {
        showError('Formato inválido. Use o formato: 1/10');
        return;
    }
    
    const current = parseInt(parts[0]);
    const total = parseInt(parts[1]);
    
    if (isNaN(current) || isNaN(total)) {
        showError('Números inválidos.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/game`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': ADMIN_PASSWORD
            },
            body: JSON.stringify({ current, total })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar número do jogo');
        }
        
        document.getElementById('gameNumber').value = '';
        await loadGameNumber();
        
        showSuccess('Número do jogo atualizado!');
    } catch (error) {
        console.error('❌ Error updating game number:', error);
        showError('Erro ao atualizar número do jogo: ' + error.message);
    }
}

// Atualizar ranking
async function updateRanking() {
    try {
        const response = await fetch(`${API_BASE}/api/teams/ranking`, {
            method: 'PUT',
            headers: {
                'x-admin-password': ADMIN_PASSWORD
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar ranking');
        }
        
        await loadInitialData();
        showSuccess('Ranking atualizado!');
    } catch (error) {
        console.error('❌ Error updating ranking:', error);
        showError('Erro ao atualizar ranking: ' + error.message);
    }
}

// Toggle team management
function toggleTeamManagement() {
    showSuccess('Modo de gestão de equipas ativado!');
}

// Definir equipa campeã
async function setChampionTeam(teamId) {
    const team = currentTeams.find(t => t._id === teamId);
    if (!team) {
        showError('Equipa não encontrada!');
        return;
    }
    
    const confirmed = confirm(`Definir "${team.name}" como equipa vencedora do campeonato?`);
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/champion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': ADMIN_PASSWORD
            },
            body: JSON.stringify({ 
                teamId: teamId,
                notes: `Equipa vencedora definida pelo administrador`
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao definir equipa campeã');
        }
        
        const result = await response.json();
        
        showSuccess(result.message);
        
        // Recarregar dados para mostrar o campeão
        await loadInitialData();
        
        // Mostrar anúncio especial
        showChampionAnnouncement(team);
        
    } catch (error) {
        console.error('❌ Error setting champion:', error);
        showError('Erro ao definir equipa campeã: ' + error.message);
    }
}

// Exibir equipas no painel admin
function displayAdminTeams(teams) {
    const adminTeamsList = document.getElementById('adminTeamsList');
    if (!adminTeamsList) return;
    
    adminTeamsList.innerHTML = teams.map(team => {
        const isChampion = currentChampion && currentChampion.teamId === team._id;
        const championBadge = isChampion ? ' 👑' : '';
        
        return `
            <li>
                <span>${team.name} (${team.tag}) - ${team.kills} kills${championBadge}</span>
                <div>
                    <button class="edit-team-btn" data-id="${team._id}">Editar</button>
                    <button class="delete-team-btn" data-id="${team._id}">Eliminar</button>
                    ${!isChampion ? `<button class="set-winner-btn" data-id="${team._id}">🏆 Campeã</button>` : ''}
                </div>
            </li>
        `;
    }).join('');
}

// Exibir kills no painel admin
function displayAdminKills(kills) {
    const adminKillsList = document.getElementById('adminKillsList');
    if (!adminKillsList) return;
    
    adminKillsList.innerHTML = kills.map(kill => `
        <li>
            <span>${kill.player} (${kill.team}) - ${kill.kills} kills</span>
            <div>
                <button class="edit-kill-btn" data-id="${kill._id}">Editar</button>
                <button class="delete-kill-btn" data-id="${kill._id}">Eliminar</button>
            </div>
        </li>
    `).join('');
}

// Editar equipa
async function editTeamPrompt(teamId) {
    const team = currentTeams.find(t => t._id === teamId);
    if (!team) return;
    
    const newName = prompt('Novo nome da equipa:', team.name);
    if (!newName) return;
    
    const newTag = prompt('Nova tag da equipa:', team.tag);
    if (!newTag) return;
    
    const newKills = prompt('Novos kills:', team.kills);
    if (newKills === null) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/teams/${teamId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': ADMIN_PASSWORD
            },
            body: JSON.stringify({ 
                name: newName, 
                tag: newTag, 
                kills: parseInt(newKills) || 0 
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao editar equipa');
        }
        
        await loadInitialData();
        showSuccess('Equipa editada com sucesso!');
    } catch (error) {
        console.error('❌ Error editing team:', error);
        showError('Erro ao editar equipa: ' + error.message);
    }
}

// Eliminar equipa
async function deleteTeam(teamId) {
    const team = currentTeams.find(t => t._id === teamId);
    if (!team) return;
    
    if (!confirm(`Tem certeza que deseja eliminar a equipa "${team.name}"?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/teams/${teamId}`, {
            method: 'DELETE',
            headers: {
                'x-admin-password': ADMIN_PASSWORD
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao eliminar equipa');
        }
        
        await loadInitialData();
        showSuccess('Equipa eliminada com sucesso!');
    } catch (error) {
        console.error('❌ Error deleting team:', error);
        showError('Erro ao eliminar equipa: ' + error.message);
    }
}

// Editar kill
async function editKillPrompt(killId) {
    const kill = currentKills.find(k => k._id === killId);
    if (!kill) return;
    
    const newPlayer = prompt('Novo nome do jogador:', kill.player);
    if (!newPlayer) return;
    
    const newTeam = prompt('Nova equipa:', kill.team);
    if (!newTeam) return;
    
    const newKills = prompt('Novos kills:', kill.kills);
    if (newKills === null) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/kills/${killId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': ADMIN_PASSWORD
            },
            body: JSON.stringify({ 
                player: newPlayer, 
                team: newTeam, 
                kills: parseInt(newKills) || 0 
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao editar kill');
        }
        
        await loadInitialData();
        showSuccess('Kill editado com sucesso!');
    } catch (error) {
        console.error('❌ Error editing kill:', error);
        showError('Erro ao editar kill: ' + error.message);
    }
}

// Eliminar kill
async function deleteKill(killId) {
    const kill = currentKills.find(k => k._id === killId);
    if (!kill) return;
    
    if (!confirm(`Tem certeza que deseja eliminar o kill de "${kill.player}"?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/kills/${killId}`, {
            method: 'DELETE',
            headers: {
                'x-admin-password': ADMIN_PASSWORD
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao eliminar kill');
        }
        
        await loadInitialData();
        showSuccess('Kill eliminado com sucesso!');
    } catch (error) {
        console.error('❌ Error deleting kill:', error);
        showError('Erro ao eliminar kill: ' + error.message);
    }
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    console.log('✅ Success:', message);
    alert(message);
}

// Mostrar mensagem de erro
function showError(message) {
    console.error('❌ Error:', message);
    alert(message);
}

// Adicionar estilos CSS para match point, campeão e anúncios - ANIMAÇÃO PULSANTE MELHORADA
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .match-point {
        border: 3px solid #ffd700 !important;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.8) !important;
    }
    
    .match-point-animation {
        animation: matchPointPulse 1.5s infinite ease-in-out;
    }
    
    .match-point-kills {
        color: #ffd700 !important;
        font-weight: 900 !important;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        animation: killsPulse 2s infinite ease-in-out;
    }
    
    .match-point-indicator {
        position: absolute;
        top: -10px;
        right: 10px;
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        color: #000;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 900;
        animation: indicatorPulse 1s infinite ease-in-out;
    }
    
    .champion-team {
        border: 3px solid #ff6b9d !important;
        background: linear-gradient(90deg, #ffd700 0%, #ff6b9d 100%) !important;
        box-shadow: 0 0 30px rgba(255, 107, 157, 1) !important;
    }
    
    .champion-animation {
        animation: championCelebration 3s infinite;
    }
    
    .champion-kills {
        color: #fff !important;
        font-weight: 900 !important;
        text-shadow: 0 0 15px rgba(255, 255, 255, 1);
    }
    
    .champion-indicator {
        position: absolute;
        top: -10px;
        right: 10px;
        background: linear-gradient(45deg, #ffd700, #ff6b9d);
        color: #fff;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 900;
        animation: championBlink 1s infinite;
    }
    
    .champion-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(90deg, #ffd700 0%, #ff6b9d 100%);
        color: #fff;
        padding: 10px;
        z-index: 10000;
        display: none;
        justify-content: center;
        align-items: center;
        box-shadow: 0 2px 20px rgba(0,0,0,0.5);
    }
    
    .champion-content {
        display: flex;
        align-items: center;
        gap: 15px;
        position: relative;
    }
    
    .champion-crown {
        font-size: 30px;
        animation: crownSpin 2s infinite;
    }
    
    .champion-text h2 {
        margin: 0;
        font-size: 18px;
    }
    
    .champion-text h3 {
        margin: 0;
        font-size: 16px;
    }
    
    .champion-text p {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
    }
    
    .champion-close {
        position: absolute;
        right: -30px;
        top: -5px;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
    }
    
    .champion-announcement-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 20000;
        animation: fadeIn 0.5s ease-in;
    }
    
    .champion-announcement {
        background: linear-gradient(135deg, #ffd700 0%, #ff6b9d 100%);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        color: #fff;
        box-shadow: 0 0 50px rgba(255, 215, 0, 0.8);
        animation: championPop 0.8s ease-out;
    }
    
    .champion-announcement h1 {
        font-size: 36px;
        margin: 0 0 20px 0;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
    
    .champion-announcement h2 {
        font-size: 28px;
        margin: 0 0 10px 0;
    }
    
    .champion-announcement h3 {
        font-size: 20px;
        margin: 0 0 20px 0;
        opacity: 0.9;
    }
    
    .champion-announcement p {
        font-size: 18px;
        margin: 0;
    }
    
    .champion-fireworks {
        font-size: 24px;
        margin: 10px 0;
        animation: fireworksAnimation 2s infinite;
    }
    
    .confetti {
        position: absolute;
        width: 10px;
        height: 10px;
        background: #ffd700;
        animation: confettiFall 3s linear infinite;
        z-index: 1000;
    }
    
    /* ANIMAÇÕES MELHORADAS */
    @keyframes matchPointPulse {
        0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
        }
        50% { 
            transform: scale(1.03); 
            box-shadow: 0 0 30px rgba(255, 215, 0, 1);
        }
    }
    
    @keyframes killsPulse {
        0%, 100% { 
            transform: scale(1);
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }
        50% { 
            transform: scale(1.1);
            text-shadow: 0 0 20px rgba(255, 215, 0, 1);
        }
    }
    
    @keyframes indicatorPulse {
        0%, 100% { 
            opacity: 1; 
            transform: scale(1);
        }
        50% { 
            opacity: 0.7; 
            transform: scale(1.1);
        }
    }
    
    @keyframes championCelebration {
        0%, 100% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.05) rotate(1deg); }
        75% { transform: scale(1.05) rotate(-1deg); }
    }
    
    @keyframes championBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    
    @keyframes crownSpin {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(10deg); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes championPop {
        0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
        50% { transform: scale(1.1) rotate(5deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    @keyframes fireworksAnimation {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    @keyframes confettiFall {
        0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
    }
    
    .no-data {
        text-align: center;
        color: white;
        padding: 20px;
        font-size: 16px;
        opacity: 0.8;
    }
    
    .set-winner-btn {
        background: linear-gradient(90deg, #ffd700 0%, #ff6b9d 100%) !important;
        color: #000 !important;
        font-weight: 900 !important;
        border: none !important;
        padding: 5px 10px !important;
        border-radius: 5px !important;
        cursor: pointer !important;
    }
    
    .set-winner-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
    }
`;
document.head.appendChild(additionalStyles);

console.log('🎉 Warzone Championship Script Loaded Successfully!');

