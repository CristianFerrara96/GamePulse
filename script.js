// script.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("playerForm");
    const playerList = document.getElementById("playerList");
    const roleFilter = document.getElementById("roleFilter");

    function savePlayers(players) {
        localStorage.setItem("gamepulse_players", JSON.stringify(players));
    }

    function getPlayers() {
        const saved = localStorage.getItem("gamepulse_players");
        return saved ? JSON.parse(saved) : [];
    }

    function updateRoleFilterOptions(players) {
        const roles = [...new Set(players.map(p => p.role))];
        roleFilter.innerHTML = '<option value="all">Tutti</option>' +
            roles.map(role => `<option value="${role}">${role}</option>`).join("");
    }

    function renderPlayers() {
        const players = getPlayers();
        const selectedRole = roleFilter.value;
        playerList.innerHTML = "";

        const filtered = selectedRole === "all" ? players : players.filter(p => p.role === selectedRole);

        filtered.forEach((player, index) => {
            const card = document.createElement("div");
            card.className = "player-card";
            card.innerHTML = `
        <h3>${player.name}</h3>
        <p><strong>Ruolo:</strong> ${player.role}</p>
        <p><strong>Rank:</strong> ${player.rank}</p>
        <p><strong>Note:</strong> ${player.notes}</p>
        <button onclick="editPlayer(${index})">✏️ Modifica</button>
        <button onclick="deletePlayer(${index})">🗑️ Rimuovi</button>
      `;
            playerList.appendChild(card);
        });
        updateRoleFilterOptions(players);
    }

    window.deletePlayer = function (index) {
        const players = getPlayers();
        players.splice(index, 1);
        savePlayers(players);
        renderPlayers();
    }

    window.editPlayer = function (index) {
        const players = getPlayers();
        const player = players[index];
        const name = prompt("Modifica Nome:", player.name);
        const role = prompt("Modifica Ruolo:", player.role);
        const rank = prompt("Modifica Rank:", player.rank);
        const notes = prompt("Modifica Note:", player.notes);

        if (name && role && rank) {
            players[index] = { name, role, rank, notes };
            savePlayers(players);
            renderPlayers();
        }
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const role = document.getElementById("role").value.trim();
        const rank = document.getElementById("rank").value.trim();
        const notes = document.getElementById("notes").value.trim();

        if (name && role && rank) {
            const newPlayer = { name, role, rank, notes };
            const players = getPlayers();
            players.push(newPlayer);
            savePlayers(players);
            renderPlayers();
            form.reset();
        }
    });

    roleFilter.addEventListener("change", renderPlayers);

    renderPlayers();
});
