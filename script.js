
// script.js corrigido — remoção do botão inexistente

// ... (todas as outras funções permanecem iguais)

function setupEventListeners() {
    // Password input enter key
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkPassword();
    });

    // Admin form inputs enter key
    const adminInputs = document.querySelectorAll('.admin-form input');
    adminInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // handled by specific button listeners
            }
        });
    });

    // Icones e modais
    document.getElementById('settingsIcon').addEventListener('click', showPasswordModal);
    document.getElementById('closePasswordModal').addEventListener('click', () => {
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordError').textContent = '';
    });

    document.getElementById('closeAdminPanel').addEventListener('click', closeAdmin);

    // Ações administrativas
    document.getElementById('addTeamBtn').addEventListener('click', addTeam);
    document.getElementById('addKillBtn').addEventListener('click', addIndividualKill);
    document.getElementById('updateGameBtn').addEventListener('click', updateGameNumber);
    document.getElementById('refreshDataBtn').addEventListener('click', loadInitialData);
    document.getElementById('updateRankingBtn').addEventListener('click', updateRanking);
    document.getElementById('editModeBtn').addEventListener('click', toggleTeamManagement);

    // Removido: resetDataBtn que não existe
    // document.getElementById('resetDataBtn').addEventListener('click', resetData);

    // Botões dinâmicos
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
