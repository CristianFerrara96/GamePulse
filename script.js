document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("playerForm");
    const playerList = document.getElementById("playerList");
    const roleSelect = document.getElementById("role");
    const gameSelect = document.getElementById("game");
    const userTypeSelect = document.getElementById("userType");
    const roleFilter = document.getElementById("roleFilter");
    const rankInput = document.getElementById("rank");
    const statInput = document.getElementById("stat");
    const searchInput = document.getElementById("searchInput");

    const rolesPerGame = {
        COD: ["IGL", "Fragger", "Support"],
        Valorant: ["IGL", "Sentinell", "Control", "Dualist", "Initiator", "Flex", "Healer"],
        RL: ["Sub", "Main"]
    };

    const statPlaceholders = {
        COD: "KD",
        Valorant: "Rank",
        RL: "MMR"
    };

    userTypeSelect.addEventListener("change", () => {
        const isCoach = userTypeSelect.value === "Coach";
        roleSelect.disabled = isCoach;
        rankInput.disabled = isCoach;
        statInput.disabled = isCoach;
        roleSelect.style.display = isCoach ? "none" : "block";
        rankInput.style.display = isCoach ? "none" : "block";
        statInput.style.display = isCoach ? "none" : "block";
    });

    gameSelect.addEventListener("change", () => {
        const game = gameSelect.value;
        const isCoach = userTypeSelect.value === "Coach";
        roleSelect.innerHTML = '<option value="">🎯 Seleziona Ruolo</option>';
        if (!isCoach && rolesPerGame[game]) {
            rolesPerGame[game].forEach(role => {
                const option = document.createElement("option");
                option.value = role;
                option.textContent = role;
                roleSelect.appendChild(option);
            });
        }
        statInput.placeholder = statPlaceholders[game] || "Statistica";
    });

    function savePlayers(players) {
        localStorage.setItem("gamepulse_players_v5", JSON.stringify(players));
    }

    function getPlayers() {
        const saved = localStorage.getItem("gamepulse_players_v5");
        return saved ? JSON.parse(saved) : [];
    }

    function renderPlayers() {
        const players = getPlayers();
        const selectedGame = roleFilter.value;
        const search = searchInput.value.toLowerCase();
        playerList.innerHTML = "";

        const filtered = players.filter(p => {
            const gameMatch = selectedGame === "all" || p.game === selectedGame;
            const searchMatch =
                p.team.toLowerCase().includes(search) ||
                p.name.toLowerCase().includes(search);
            return gameMatch && searchMatch;
        });

        filtered.sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));
        const teams = [...new Set(filtered.map(p => p.team))];

        teams.forEach(team => {
            const teamBlock = document.createElement("div");
            teamBlock.className = "team-block";
            teamBlock.dataset.team = team;

            teamBlock.addEventListener("dragover", e => e.preventDefault());
            teamBlock.addEventListener("dragenter", e => teamBlock.classList.add("drag-over"));
            teamBlock.addEventListener("dragleave", e => teamBlock.classList.remove("drag-over"));
            teamBlock.addEventListener("drop", e => {
                teamBlock.classList.remove("drag-over");
                const draggedIndex = e.dataTransfer.getData("text/plain");
                const players = getPlayers();
                players[draggedIndex].team = team;
                savePlayers(players);
                renderPlayers();
            });

            const title = document.createElement("h2");
            title.textContent = `🏷️ Team: ${team}`;
            teamBlock.appendChild(title);

            filtered.filter(p => p.team === team).forEach((player, index) => {
                const globalIndex = getPlayers().findIndex(pl => pl.name === player.name && pl.team === player.team);

                const card = document.createElement("div");
                card.className = "player-card";
                card.setAttribute("draggable", "true");
                card.addEventListener("dragstart", e => {
                    e.dataTransfer.setData("text/plain", globalIndex);
                });

                const icon = player.userType === "Coach" ? "🧑‍🏫" : "🎮";
                const badgeClass = player.role ? `badge-${player.role.toLowerCase()}` : '';
                const badgeHTML = player.role ? `<span class="badge ${badgeClass}">${player.role}</span>` : '';

                card.innerHTML = `
          ${player.photo ? `<img src="${player.photo}" alt="Foto">` : ""}
          <h3>${icon} ${player.name} ${badgeHTML}</h3>
          <p><strong>Gioco:</strong> ${player.game}</p>
          <p><strong>Team:</strong> ${player.team}</p>
          ${player.userType !== "Coach" ? `<p><strong>Ruolo:</strong> ${player.role}</p>` : ""}
          <p><strong>ID:</strong> ${player.id}</p>
          <p><strong>Discord:</strong> ${player.discord || "N/A"}</p>
          <p><strong>Disponibilità:</strong> ${player.availability || "N/A"}</p>
          ${player.userType !== "Coach" ? `<p><strong>Statistica:</strong> ${player.stat}</p>` : ""}
          ${player.userType !== "Coach" ? `<p><strong>Rank:</strong> ${player.rank}</p>` : ""}
          <p><strong>Note:</strong> ${player.notes}</p>
          <p><strong>Tracker:</strong> <a href="${player.tracker}" target="_blank">Link</a></p>
          <button onclick="editPlayer(${globalIndex})">✏️ Modifica</button>
          <button onclick="confirmDelete(${globalIndex})">🗑️ Elimina</button>
        `;
                teamBlock.appendChild(card);
            });

            playerList.appendChild(teamBlock);
        });

        const all = getPlayers().map(p => p.game);
        const games = [...new Set(all)];
        roleFilter.innerHTML = '<option value="all">Tutti</option>' +
            games.map(game => `<option value="${game}">${game}</option>`).join("");
    }

    window.confirmDelete = function (index) {
        if (confirm("Sei sicura di voler eliminare questo utente?")) {
            deletePlayer(index);
        }
    };

    window.deletePlayer = function (index) {
        const players = getPlayers();
        players.splice(index, 1);
        savePlayers(players);
        renderPlayers();
    };

    window.editPlayer = function (index) {
        const players = getPlayers();
        const player = players[index];
        const name = prompt("Modifica Nome:", player.name) || player.name;
        const team = prompt("Modifica Team:", player.team) || player.team;
        const discord = prompt("Modifica Discord:", player.discord || "") || player.discord;
        const availability = prompt("Modifica Disponibilità:", player.availability || "") || player.availability;
        player.name = name;
        player.team = team;
        player.discord = discord;
        player.availability = availability;
        savePlayers(players);
        renderPlayers();
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const userType = userTypeSelect.value;
        const game = gameSelect.value;
        const name = document.getElementById("name").value.trim();
        const role = roleSelect.value;
        const team = document.getElementById("team").value.trim();
        const id = document.getElementById("idGame").value.trim();
        const tracker = document.getElementById("tracker").value.trim();
        const discord = document.getElementById("discord").value.trim();
        const availability = document.getElementById("availability").value.trim();
        const rank = rankInput.value.trim();
        const stat = statInput.value.trim();
        const notes = document.getElementById("notes").value.trim();
        const photoFile = document.getElementById("photo").files[0];

        if (userType && name && game && id) {
            const reader = new FileReader();
            reader.onload = () => {
                const photo = reader.result;
                const newPlayer = { userType, game, name, role, team, id, tracker, rank, stat, notes, photo, discord, availability };
                const players = getPlayers();
                players.push(newPlayer);
                savePlayers(players);
                renderPlayers();
                form.reset();
            };
            if (photoFile) {
                reader.readAsDataURL(photoFile);
            } else {
                const newPlayer = { userType, game, name, role, team, id, tracker, rank, stat, notes, photo: "", discord, availability };
                const players = getPlayers();
                players.push(newPlayer);
                savePlayers(players);
                renderPlayers();
                form.reset();
            }
        }
    });

    roleFilter.addEventListener("change", renderPlayers);
    searchInput.addEventListener("input", renderPlayers);

    renderPlayers();
});