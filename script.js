// Global variables
const ADMIN_PASSWORD = '929424';
let teams = [];
let individualKills = [];
let socket; // Socket.IO connection
const API_BASE_URL = 'https://warzone-kzi5.onrender.com/api';

// Team icons mapping
const teamIcons = {
    'HAVOC': '🔥',
    'BLAZT': '⚡',
    'LA ELE': '👑',
    'ECHO': '🎯',
    'CONGY': '🚀',
    'ADRIAN': '🎮',
    'DEKI': '⭐',
    'RMR': '🏰',
    'SPARKTYN': '💥',
    'OTTERSEVES': '🌊',
    'PHANTOM': '👻',
    'VIPER': '🐍',
    'GHOST': '💀',
    'TITAN': '💪',
    'WOLF': '🐺'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadGameNumber(); // Load saved game number
    loadInitialData();
    setupEventListeners();
    setupSocketListeners(); // Setup Socket.IO listeners
    startAutoRefresh();
    
    // Ensure password modal is hidden on page load
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
});

// Setup Socket.IO listeners
function setupSocketListeners() {
    // Initialize Socket.IO connection
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server via Socket.IO');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    
    // Listen for game number updates
    socket.on('game-number-updated', (gameNumber) => {
        updateGameDisplay(gameNumber);
    });
    
    // Listen for team updates
    socket.on('team-updated', () => {
        loadTeams();
    });
    
    socket.on('team-added', () => {
        loadTeams();
    });
    
    socket.on('team-deleted', () => {
        loadTeams();
    });
    
    socket.on('ranking-updated', () => {
        loadTeams();
    });
    
    // Listen for kill updates
    socket.on('kill-updated', () => {
        loadIndividualKills();
    });
    
    socket.on('kill-added', () => {
        loadIndividualKills();
    });
    
    socket.on('kill-deleted', () => {
        loadIndividualKills();
    });
    
    socket.on('data-reset', () => {
        loadInitialData();
    });
}

// Setup event listeners
function setupEventListeners() {
    // Password input enter key
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    // Admin form inputs enter key
    const adminInputs = document.querySelectorAll('.admin-form input');
    adminInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // This will be handled by specific functions for add/edit/delete
            }
        });
    });

    // Event listener for the settings icon
    document.getElementById('settingsIcon').addEventListener('click', showPasswordModal);

    // Event listener for closing the password modal
    document.getElementById('closePasswordModal').addEventListener('click', function() {
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordError').textContent = '';
    });

    // Event listener for closing the admin panel
    document.getElementById('closeAdminPanel').addEventListener('click', closeAdmin);

    // Event listeners for admin actions
    document.getElementById('addTeamBtn').addEventListener('click', addTeam);
    document.getElementById('addKillBtn').addEventListener('click', addIndividualKill);
    document.getElementById('updateGameBtn').addEventListener('click', updateGameNumber);
    document.getElementById('resetDataBtn').addEventListener('click', resetData);
    document.getElementById('refreshDataBtn').addEventListener('click', loadInitialData);
    document.getElementById('updateRankingBtn').addEventListener('click', updateRanking);

    // Admin edit/delete functionality
    document.getElementById('adminPanel').addEventListener('click', async function(event) {
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
        }
    });
}

// Load initial data
async function loadInitialData() {
    try {
        await Promise.all([
            loadTeams(),
            loadIndividualKills()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        // Fallback to local storage if API fails
        loadFromLocalStorage();
    }
}

// Load default data if API is not available (removed, now uses local storage fallback)

// Load teams from API
async function loadTeams() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams`);
        if (response.ok) {
            teams = await response.json();
            renderTeams();
        } else {
            throw new Error('Failed to load teams');
        }
    } catch (error) {
        console.error('Error loading teams:', error);
        throw error;
    }
}

// Load individual kills from API
async function loadIndividualKills() {
    try {
        const response = await fetch(`${API_BASE_URL}/kills`);
        if (response.ok) {
            individualKills = await response.json();
            renderIndividualKills();
        } else {
            throw new Error('Failed to load individual kills');
        }
    } catch (error) {
        console.error('Error loading individual kills:', error);
        throw error;
    }
}

// Render teams list
function renderTeams() {
    const teamsList = document.getElementById('teamsList');
    teamsList.innerHTML = '';

    teams.forEach((team, index) => {
        const teamCard = createTeamCard(team, index);
        teamsList.appendChild(teamCard);
    });
    updateAdminPanelTeams();
}

// Create team card element
function createTeamCard(team, index) {
    const card = document.createElement('div');
    card.className = 'team-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    card.setAttribute('data-position', team.position); // Adicionar data-position para CSS

    // Add match point class if team has 150+ kills
    if (team.kills >= 150) {
        card.classList.add('match-point');
    }

    const icon = teamIcons[team.name] || '🎮';
    
    card.innerHTML = `
        <div class="team-left">
            <div class="team-position">${team.position}</div>
            <div class="team-icon">${icon}</div>
            <div class="team-info">
                <div class="team-name">${team.name}</div>
                <div class="team-tag">${team.tag}</div>
            </div>
        </div>
        <div class="team-right">
            <div class="team-status ${team.status === 'online' ? 'pulse' : ''}"></div>
            <div class="team-kills">${team.kills}</div>
        </div>
    `;

    return card;
}

// Render individual kills ranking
function renderIndividualKills() {
    const killsRanking = document.getElementById('killsRanking');
    killsRanking.innerHTML = '';

    // Only show top 3 individual kills
    individualKills.slice(0, 3).forEach((kill, index) => {
        const killCard = createKillCard(kill, index);
        killsRanking.appendChild(killCard);
    });
    updateAdminPanelKills();
}

// Create kill card element
function createKillCard(kill, index) {
    const card = document.createElement('div');
    card.className = 'kill-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
        <div class="kill-position">${kill.position}</div>
        <div class="kill-player">${kill.player}</div>
        <div class="kill-icon">💀</div>
        <div class="kill-count">${kill.kills}</div>
    `;

    return card;
}

// Show password modal
function showPasswordModal() {
    document.getElementById('passwordModal').style.display = 'flex';
    document.getElementById('passwordInput').focus();
}

// Check password (now sends to backend)
async function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    const errorElement = document.getElementById('passwordError');

    if (password !== ADMIN_PASSWORD) {
        errorElement.textContent = 'Senha incorreta!';
        document.getElementById('passwordInput').value = '';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/authenticate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': password
            }
        });

        if (response.ok) {
            document.getElementById('passwordModal').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'flex';
            document.getElementById('passwordInput').value = '';
            errorElement.textContent = '';
            loadAdminData(); // Load data for admin panel
        } else {
            errorElement.textContent = 'Erro de autenticação!';
            document.getElementById('passwordInput').value = '';
        }
    } catch (error) {
        console.error('Error authenticating:', error);
        // Allow offline mode with correct password
        if (password === ADMIN_PASSWORD) {
            document.getElementById('passwordModal').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'flex';
            document.getElementById('passwordInput').value = '';
            errorElement.textContent = '';
            loadAdminData();
        } else {
            errorElement.textContent = 'Erro de conexão com o servidor.';
        }
    }
}

// Close admin panel
function closeAdmin() {
    document.getElementById('adminPanel').style.display = 'none';
}

// Add new team
async function addTeam() {
    const name = document.getElementById('teamName').value.trim();
    const tag = document.getElementById('teamTag').value.trim();
    const kills = parseInt(document.getElementById('teamKills').value) || 0;
    const adminPassword = ADMIN_PASSWORD; // Use hardcoded password

    if (!name || !tag) {
        alert('Por favor, preencha o nome e a tag da equipe.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/teams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword
            },
            body: JSON.stringify({ name, tag, kills })
        });

        if (response.ok) {
            await loadTeams(); // Reload teams to get updated positions
            clearAdminForm();
            alert('Equipe adicionada com sucesso!');
        } else {
            const errorData = await response.json();
            alert(`Erro ao adicionar equipe: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error adding team:', error);
        alert('Erro de conexão ao adicionar equipe.');
    }
}

// Edit team
async function editTeamPrompt(teamId) {
    const teamToEdit = teams.find(team => team._id === teamId);
    if (!teamToEdit) {
        alert('Equipe não encontrada.');
        return;
    }

    const newName = prompt('Novo nome da equipe:', teamToEdit.name);
    if (newName === null) return; // User cancelled

    const newTag = prompt('Nova tag da equipe:', teamToEdit.tag);
    if (newTag === null) return; // User cancelled

    const newKills = prompt('Novas kills da equipe:', teamToEdit.kills);
    if (newKills === null) return; // User cancelled

    const adminPassword = ADMIN_PASSWORD; // Use hardcoded password

    try {
        const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword
            },
            body: JSON.stringify({ name: newName, tag: newTag, kills: parseInt(newKills) })
        });

        if (response.ok) {
            await loadTeams();
            alert('Equipe atualizada com sucesso!');
        } else {
            const errorData = await response.json();
            alert(`Erro ao atualizar equipe: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error editing team:', error);
        alert('Erro de conexão ao atualizar equipe.');
    }
}

// Delete team
async function deleteTeam(teamId) {
    if (!confirm('Tem certeza que deseja deletar esta equipe?')) {
        return;
    }
    const adminPassword = ADMIN_PASSWORD; // Use hardcoded password

    try {
        const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
            method: 'DELETE',
            headers: {
                'X-Admin-Password': adminPassword
            }
        });

        if (response.ok) {
            await loadTeams();
            alert('Equipe deletada com sucesso!');
        } else {
            const errorData = await response.json();
            alert(`Erro ao deletar equipe: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error deleting team:', error);
        alert('Erro de conexão ao deletar equipe.');
    }
}

// Edit individual kill
async function editKillPrompt(killId) {
    const killToEdit = individualKills.find(kill => kill._id === killId);
    if (!killToEdit) {
        alert('Kill individual não encontrado.');
        return;
    }

    const newPlayer = prompt('Novo nome do jogador:', killToEdit.player);
    if (newPlayer === null) return; // User cancelled

    const newKills = prompt('Novas kills do jogador:', killToEdit.kills);
    if (newKills === null) return; // User cancelled

    const newTeam = prompt('Nova equipe do jogador:', killToEdit.team);
    if (newTeam === null) return; // User cancelled

    const adminPassword = ADMIN_PASSWORD; // Use hardcoded password

    try {
        const response = await fetch(`https://warzone-kzi5.onrender.com/kills/${killId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword
            },
            body: JSON.stringify({ player: newPlayer, kills: parseInt(newKills), team: newTeam })
        });

        if (response.ok) {
            await loadIndividualKills();
            alert('Kill individual atualizado com sucesso!');
        } else {
            const errorData = await response.json();
            alert(`Erro ao atualizar kill individual: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error editing individual kill:', error);
        alert('Erro de conexão ao atualizar kill individual.');
    }
}

// Delete individual kill
async function deleteKill(killId) {
    if (!confirm('Tem certeza que deseja deletar este kill individual?')) {
        return;
    }
    const adminPassword = ADMIN_PASSWORD; // Use hardcoded password

    try {
        const response = await fetch(`https://warzone-kzi5.onrender.com/kills/${killId}`, {
            method: 'DELETE',
            headers: {
                'X-Admin-Password': ADMIN_PASSWORD
            }
        });

        if (response.ok) {
            await loadIndividualKills();
            alert('Kill individual deletado com sucesso!');
        } else {
            const errorData = await response.json();
            alert(`Erro ao deletar kill individual: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error deleting individual kill:', error);
        alert('Erro de conexão ao deletar kill individual.');
    }
}

// Update team positions based on kills (now handled by backend)
function updateTeamPositions() {
    // This function is now primarily for local sorting before rendering if API fails
    teams.sort((a, b) => b.kills - a.kills);
    teams.forEach((team, index) => {
        team.position = index + 1;
    });
}

// Update ranking (now triggers backend update)
async function updateRanking() {
    const adminPassword = ADMIN_PASSWORD; // Use hardcoded password
    try {
        const response = await fetch(`https://warzone-kzi5.onrender.com/teams/ranking`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword
            }
        });

        if (response.ok) {
            await loadTeams();
            alert('Ranking de equipes atualizado com sucesso!');
        } else {
            const errorData = await response.json();
            alert(`Erro ao atualizar ranking de equipes: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error updating ranking:', error);
        alert('Erro de conexão ao atualizar ranking de equipes.');
    }
}

// Reset all data
async function resetData() {
    if (confirm('Tem certeza que deseja resetar todos os dados?')) {
        const adminPassword = ADMIN_PASSWORD; // Use hardcoded password
        try {
            const response = await fetch(`${API_BASE_URL}/reset`, {
                method: 'POST',
                headers: {
                    'X-Admin-Password': adminPassword
                }
            });

            if (response.ok) {
                teams = [];
                individualKills = [];
                renderTeams();
                renderIndividualKills();
                alert('Dados resetados com sucesso!');
            } else {
                const errorData = await response.json();
                alert(`Erro ao resetar dados: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error resetting data:', error);
            alert('Erro de conexão ao resetar dados.');
        }
    }
}

// Clear admin form
function clearAdminForm() {
    document.getElementById('teamName').value = '';
    document.getElementById('teamTag').value = '';
    document.getElementById('teamKills').value = '';
}

// Save to local storage (fallback)
function saveToLocalStorage() {
    localStorage.setItem('warzoneTeams', JSON.stringify(teams));
    localStorage.setItem('warzoneKills', JSON.stringify(individualKills));
}

// Load from local storage if API fails
function loadFromLocalStorage() {
    // Load teams from localStorage or use default data
    const savedTeams = localStorage.getItem('warzoneTeams');
    if (savedTeams) {
        teams = JSON.parse(savedTeams);
    } else {
        // Default test data
        teams = [
            { _id: '1', position: 1, name: 'HAVOC', tag: 'MIXED STAFF', kills: 83, status: 'online' },
            { _id: '2', position: 2, name: 'BLAZT', tag: 'SARGERIUM SKULLFAÇE', kills: 11, status: 'online' },
            { _id: '3', position: 3, name: 'LA ELE', tag: 'CERASUS', kills: 10, status: 'online' },
            { _id: '4', position: 4, name: 'ECHO', tag: 'FRAXELL LEGION', kills: 2, status: 'online' },
            { _id: '5', position: 5, name: 'CONGY', tag: 'NEWBZ GAME', kills: 0, status: 'online' }
        ];
        localStorage.setItem('warzoneTeams', JSON.stringify(teams));
    }
    
    // Load individual kills from localStorage or use default data
    const savedKills = localStorage.getItem('warzoneKills');
    if (savedKills) {
        individualKills = JSON.parse(savedKills);
    } else {
        // Default test data
        individualKills = [
            { _id: '1', position: 1, player: 'CRUSE GIGA', kills: 5, team: 'HAVOC' },
            { _id: '2', position: 2, player: 'SPARKO', kills: 4, team: 'BLAZT' },
            { _id: '3', position: 3, player: 'JC', kills: 3, team: 'LA ELE' }
        ];
        localStorage.setItem('warzoneKills', JSON.stringify(individualKills));
    }
    
    renderTeams();
    renderIndividualKills();
}

// Auto refresh data every 30 seconds
function startAutoRefresh() {
    setInterval(async () => {
        try {
            await Promise.all([
                loadTeams(),
                loadIndividualKills()
            ]);
        } catch (error) {
            console.log('Auto refresh failed, using local data');
        }
    }, 30000);
}

// Add team kill (for real-time updates) - now uses backend
async function addTeamKill(teamName) {
    const team = teams.find(t => t.name === teamName);
    if (team) {
        const adminPassword = ADMIN_PASSWORD; // Use hardcoded password
        try {
            const response = await fetch(`${API_BASE_URL}/teams/${team._id}/kill`, {
                method: 'POST',
                headers: {
                    'X-Admin-Password': adminPassword
                }
            });
            if (response.ok) {
                await loadTeams();
            } else {
                const errorData = await response.json();
                console.error('Error updating team kill:', errorData.error);
            }
        } catch (error) {
            console.error('Error updating team kill:', error);
            saveToLocalStorage();
        }
    }
}

// Add individual kill (now uses backend)
async function addIndividualKill(playerName, teamName) {
    const adminPassword = ADMIN_PASSWORD; // Use hardcoded password
    try {
        const response = await fetch(`${API_BASE_URL}/kills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword
            },
            body: JSON.stringify({ player: playerName, team: teamName })
        });
        if (response.ok) {
            await loadIndividualKills();
        } else {
            const errorData = await response.json();
            console.error('Error adding individual kill:', errorData.error);
        }
    } catch (error) {
        console.error('Error adding individual kill:', error);
        saveToLocalStorage();
    }
}

// Admin panel data loading and rendering
async function loadAdminData() {
    // Reload data to ensure admin panel has latest info
    await loadTeams();
    await loadIndividualKills();
    updateAdminPanelTeams();
    updateAdminPanelKills();
}

function updateAdminPanelTeams() {
    const adminTeamsList = document.getElementById('adminTeamsList');
    adminTeamsList.innerHTML = '';
    teams.forEach(team => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${team.name} (${team.tag}) - Kills: ${team.kills}</span>
            <div>
                <button class="edit-team-btn" data-id="${team._id}">Editar</button>
                <button class="delete-team-btn" data-id="${team._id}">Deletar</button>
            </div>
        `;
        adminTeamsList.appendChild(li);
    });
}

function updateAdminPanelKills() {
    const adminKillsList = document.getElementById('adminKillsList');
    adminKillsList.innerHTML = '';
    individualKills.forEach(kill => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${kill.player} (${kill.team}) - Kills: ${kill.kills}</span>
            <div>
                <button class="edit-kill-btn" data-id="${kill._id}">Editar</button>
                <button class="delete-kill-btn" data-id="${kill._id}">Deletar</button>
            </div>
        `;
        adminKillsList.appendChild(li);
    });
}

// Handle window resize for responsive design
window.addEventListener('resize', function() {
    // Trigger re-render if needed for responsive adjustments
    renderTeams();
    renderIndividualKills();
});

// Handle visibility change for auto-refresh
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, refresh data
        loadInitialData();
    }
});

// Export functions for external use
window.warzoneApp = {
    addTeamKill,
    addIndividualKill,
    updateRanking,
    loadInitialData,
    showPasswordModal // Expose for settings icon
};




// Add individual kill from form
async function submitIndividualKillForm() {
    const playerName = document.getElementById('playerName').value.trim();
    const playerTeam = document.getElementById('playerTeam').value.trim();

    if (!playerName || !playerTeam) {
        alert('Por favor, preencha o nome do jogador e a equipe.');
        return;
    }

    const adminPassword = ADMIN_PASSWORD; // Use hardcoded password
    try {
        const response = await fetch(`${API_BASE_URL}/kills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword
            },
            body: JSON.stringify({ player: playerName, team: playerTeam })
        });

        if (response.ok) {
            await loadIndividualKills();
            clearKillForm();
            alert('Kill individual adicionado com sucesso!');
        } else {
            const errorData = await response.json();
            alert(`Erro ao adicionar kill individual: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error adding individual kill:', error);
        alert('Erro de conexão ao adicionar kill individual.');
    }
}

// Clear kill form
function clearKillForm() {
    document.getElementById('playerName').value = '';
    document.getElementById('playerTeam').value = '';
}


// Update game number (now uses API)
async function updateGameNumber() {
    const gameNumberInput = document.getElementById('gameNumber').value.trim();
    const adminPassword = ADMIN_PASSWORD;
    
    if (!gameNumberInput) {
        alert('Por favor, insira o número do jogo.');
        return;
    }
    
    // Parse the input (e.g., "1/10" or "5/10")
    const match = gameNumberInput.match(/^(\d+)\/(\d+)$/);
    if (!match) {
        alert('Formato inválido. Use o formato "1/10".');
        return;
    }
    
    const current = parseInt(match[1]);
    const total = parseInt(match[2]);
    
    if (current < 1 || current > total) {
        alert('Número do jogo inválido.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/game`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword
            },
            body: JSON.stringify({ current, total })
        });
        
        if (response.ok) {
            const gameNumber = await response.json();
            updateGameDisplay(gameNumber);
            document.getElementById('gameNumber').value = '';
            alert('Número do jogo atualizado com sucesso!');
        } else {
            const errorData = await response.json();
            alert(`Erro ao atualizar número do jogo: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error updating game number:', error);
        // Fallback to local storage update
        const gameLabel = document.getElementById('gameLabel');
        gameLabel.textContent = `JOGO ${current}/${total}`;
        localStorage.setItem('gameNumber', `JOGO ${current}/${total}`);
        document.getElementById('gameNumber').value = '';
        alert('Número do jogo atualizado localmente (sem conexão com servidor).');
    }
}

// Load game number from API
async function loadGameNumber() {
    try {
        const response = await fetch(`${API_BASE_URL}/game`);
        if (response.ok) {
            const gameNumber = await response.json();
            updateGameDisplay(gameNumber);
        } else {
            throw new Error('Failed to load game number');
        }
    } catch (error) {
        console.error('Error loading game number:', error);
        // Fallback to local storage
        const savedGameNumber = localStorage.getItem('gameNumber');
        if (savedGameNumber) {
            const gameLabel = document.getElementById('gameLabel');
            gameLabel.textContent = savedGameNumber;
        }
    }
}

// Update game display
function updateGameDisplay(gameNumber) {
    const gameLabel = document.getElementById('gameLabel');
    gameLabel.textContent = `JOGO ${gameNumber.current}/${gameNumber.total}`;
    
    // Also save to local storage as backup
    localStorage.setItem('gameNumber', `JOGO ${gameNumber.current}/${gameNumber.total}`);
}