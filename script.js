// Script simplificado para o Campeonato Warzone
console.log('Script carregado');

// Dados de exemplo
const sampleTeams = [
    { _id: '1', name: 'Team Alpha', tag: 'ALPHA', kills: 150, position: 1, status: 'online' },
    { _id: '2', name: 'Team Beta', tag: 'BETA', kills: 120, position: 2, status: 'online' },
    { _id: '3', name: 'Team Gamma', tag: 'GAMMA', kills: 95, position: 3, status: 'online' },
    { _id: '4', name: 'Team Delta', tag: 'DELTA', kills: 80, position: 4, status: 'online' }
];

const sampleKills = [
    { _id: '1', player: 'João Silva', team: 'ALPHA', kills: 25 },
    { _id: '2', player: 'Maria Santos', team: 'BETA', kills: 22 },
    { _id: '3', player: 'Pedro Costa', team: 'GAMMA', kills: 18 },
    { _id: '4', player: 'Ana Ferreira', team: 'ALPHA', kills: 15 },
    { _id: '5', player: 'Carlos Oliveira', team: 'DELTA', kills: 12 }
];

// Configurações
const ADMIN_PASSWORD = '929424';
let adminMode = false;

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando aplicação...');
    initializeApp();
});

function initializeApp() {
    console.log('Inicializando aplicação...');
    setupEventListeners();
    displayTeams(sampleTeams);
    displayKills(sampleKills);
    displayGameNumber({ current: 1, total: 10 });
}

function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botão de configurações
    const settingsIcon = document.getElementById('settingsIcon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', showPasswordModal);
        console.log('Event listener adicionado ao botão de configurações');
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
    
    // Botão de entrar
    const enterButton = document.querySelector('.modal-content button');
    if (enterButton) {
        enterButton.addEventListener('click', checkPassword);
    }
    
    // Fechar painel admin
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', closeAdmin);
    }
    
    // Botões do painel admin
    const addTeamBtn = document.getElementById('addTeamBtn');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', addTeam);
    }
    
    const addKillBtn = document.getElementById('addKillBtn');
    if (addKillBtn) {
        addKillBtn.addEventListener('click', addIndividualKill);
    }
    
    const refreshDataBtn = document.getElementById('refreshDataBtn');
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', refreshData);
    }
}

function showPasswordModal() {
    console.log('Mostrando modal de password...');
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'flex';
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.focus();
        }
    }
}

function hidePasswordModal() {
    console.log('Escondendo modal de password...');
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

function checkPassword() {
    console.log('Verificando password...');
    const passwordInput = document.getElementById('passwordInput');
    const errorElement = document.getElementById('passwordError');
    
    if (!passwordInput) {
        console.error('Campo de password não encontrado');
        return;
    }
    
    const password = passwordInput.value;
    
    if (password === ADMIN_PASSWORD) {
        console.log('Password correta, abrindo painel admin...');
        hidePasswordModal();
        showAdminPanel();
    } else {
        console.log('Password incorreta');
        if (errorElement) {
            errorElement.textContent = 'Senha incorreta!';
        }
    }
    
    passwordInput.value = '';
}

function showAdminPanel() {
    console.log('Mostrando painel admin...');
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'flex';
        adminMode = true;
        displayAdminTeams(sampleTeams);
        displayAdminKills(sampleKills);
    }
}

function closeAdmin() {
    console.log('Fechando painel admin...');
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'none';
        adminMode = false;
    }
}

function displayTeams(teams) {
    console.log('Exibindo equipas:', teams);
    const teamsList = document.getElementById('teamsList');
    if (!teamsList) {
        console.error('Elemento teamsList não encontrado');
        return;
    }
    
    if (teams.length === 0) {
        teamsList.innerHTML = '<div class="no-data" style="text-align: center; color: white; padding: 20px;">Nenhuma equipa encontrada</div>';
        return;
    }
    
    // Ordenar equipas por kills (descendente)
    const sortedTeams = [...teams].sort((a, b) => b.kills - a.kills);
    
    teamsList.innerHTML = sortedTeams.map((team, index) => {
        const position = index + 1;
        return `
            <div class="team-card fade-in" data-position="${position}">
                <div class="team-left">
                    <div class="team-position">${position}</div>
                    <div class="team-icon">🎯</div>
                    <div class="team-info">
                        <div class="team-name">${team.name}</div>
                        <div class="team-tag">${team.tag}</div>
                    </div>
                </div>
                <div class="team-right">
                    <div class="team-status ${team.status === 'online' ? 'pulse' : ''}"></div>
                    <div class="team-kills">${team.kills}</div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Equipas exibidas com sucesso');
}

function displayKills(kills) {
    console.log('Exibindo kills:', kills);
    const killsRanking = document.getElementById('killsRanking');
    if (!killsRanking) {
        console.error('Elemento killsRanking não encontrado');
        return;
    }
    
    if (kills.length === 0) {
        killsRanking.innerHTML = '<div class="no-data" style="text-align: center; color: white; padding: 20px;">Nenhum kill individual encontrado</div>';
        return;
    }
    
    // Ordenar kills por número de kills (descendente)
    const sortedKills = [...kills].sort((a, b) => b.kills - a.kills);
    
    killsRanking.innerHTML = sortedKills.map((kill, index) => {
        const position = index + 1;
        return `
            <div class="kill-card fade-in">
                <div class="kill-position">${position}</div>
                <div class="kill-icon">💀</div>
                <div class="kill-player">${kill.player}</div>
                <div class="kill-count">${kill.kills}</div>
                <div class="kill-team" style="font-size: 10px; opacity: 0.8; margin-top: 5px;">${kill.team}</div>
            </div>
        `;
    }).join('');
    
    console.log('Kills exibidos com sucesso');
}

function displayGameNumber(gameData) {
    console.log('Exibindo número do jogo:', gameData);
    const gameLabel = document.getElementById('gameLabel');
    if (gameLabel) {
        gameLabel.textContent = `JOGO ${gameData.current}/${gameData.total}`;
    }
}

function displayAdminTeams(teams) {
    const adminTeamsList = document.getElementById('adminTeamsList');
    if (!adminTeamsList) return;
    
    adminTeamsList.innerHTML = teams.map(team => `
        <li>
            <span>${team.name} (${team.tag}) - ${team.kills} kills</span>
            <div>
                <button class="edit-team-btn" data-id="${team._id}">Editar</button>
                <button class="delete-team-btn" data-id="${team._id}">Eliminar</button>
            </div>
        </li>
    `).join('');
}

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

function addTeam() {
    const name = document.getElementById('teamName').value.trim();
    const tag = document.getElementById('teamTag').value.trim();
    const kills = parseInt(document.getElementById('teamKills').value) || 0;
    
    if (!name || !tag) {
        alert('Por favor, preencha o nome e tag da equipa.');
        return;
    }
    
    const newTeam = {
        _id: Date.now().toString(),
        name: name,
        tag: tag,
        kills: kills,
        status: 'online'
    };
    
    sampleTeams.push(newTeam);
    
    // Limpar campos
    document.getElementById('teamName').value = '';
    document.getElementById('teamTag').value = '';
    document.getElementById('teamKills').value = '';
    
    // Atualizar exibição
    displayTeams(sampleTeams);
    displayAdminTeams(sampleTeams);
    
    alert('Equipa adicionada com sucesso!');
}

function addIndividualKill() {
    const player = document.getElementById('playerName').value.trim();
    const team = document.getElementById('playerTeam').value.trim();
    
    if (!player || !team) {
        alert('Por favor, preencha o nome do jogador e equipa.');
        return;
    }
    
    // Verificar se já existe um registo para este jogador
    const existingKillIndex = sampleKills.findIndex(k => k.player.toLowerCase() === player.toLowerCase());
    
    if (existingKillIndex !== -1) {
        // Atualizar kill existente
        sampleKills[existingKillIndex].kills += 1;
    } else {
        // Criar novo registo
        const newKill = {
            _id: Date.now().toString(),
            player: player,
            team: team,
            kills: 1
        };
        sampleKills.push(newKill);
    }
    
    // Limpar campos
    document.getElementById('playerName').value = '';
    document.getElementById('playerTeam').value = '';
    
    // Atualizar exibição
    displayKills(sampleKills);
    displayAdminKills(sampleKills);
    
    alert('Kill adicionado com sucesso!');
}

function refreshData() {
    displayTeams(sampleTeams);
    displayKills(sampleKills);
    displayGameNumber({ current: 1, total: 10 });
    alert('Dados atualizados!');
}

// Adicionar estilos para elementos que podem estar em falta
const style = document.createElement('style');
style.textContent = `
    .no-data {
        text-align: center;
        color: white;
        padding: 20px;
        font-size: 16px;
        opacity: 0.8;
    }
    
    .kill-team {
        font-size: 10px;
        opacity: 0.8;
        margin-top: 5px;
    }
`;
document.head.appendChild(style);

console.log('Script simplificado carregado com sucesso');

