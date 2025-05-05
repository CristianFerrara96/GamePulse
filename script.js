// Inizializza Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAaix6Ctj4JojoXL3YtctauX7ZPnYQERCo",
    authDomain: "domustrackerdb.firebaseapp.com",
    projectId: "domustrackerdb",
    storageBucket: "domustrackerdb.appspot.com",
    messagingSenderId: "860989800221",
    appId: "1:860989800221:web:9d9b813a4103a6ebfe6bf4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variabili principali
const form = document.getElementById("playerForm");
const playerList = document.getElementById("playerList");
const roleSelect = document.getElementById("role");
const gameSelect = document.getElementById("game");
const userTypeSelect = document.getElementById("userType");
const roleFilter = document.getElementById("roleFilter");
const rankInput = document.getElementById("rank");
const statInput = document.getElementById("stat");
const searchInput = document.getElementById("searchInput");

// Ruoli per gioco
const rolesPerGame = {
    COD: ["IGL", "Fragger", "Support"],
    Valorant: ["Duelist", "Initiator", "Controller", "Sentinel"],
    RL: ["Disruptor", "Playmaker", "Defender"]
};

// Aggiorna form in base a tipo utente
function updateFormFields() {
    const userType = userTypeSelect.value;
    const game = gameSelect.value;

    // Gestione ruolo, rank e stat per Coach vs Player
    if (userType === "Coach") {
        roleSelect.innerHTML = '<option value="">🎯 Ruolo</option>';
        roleSelect.disabled = true;
        rankInput.disabled = true;
        statInput.disabled = true;
        roleSelect.style.display = "none";
        rankInput.style.display = "none";
        statInput.style.display = "none";
    } else {
        roleSelect.disabled = false;
        rankInput.disabled = false;
        statInput.disabled = false;
        roleSelect.style.display = "block";
        rankInput.style.display = "block";
        statInput.style.display = "block";

        roleSelect.innerHTML = '<option value="">🎯 Seleziona Ruolo</option>';
        if (rolesPerGame[game]) {
            rolesPerGame[game].forEach(role => {
                const option = document.createElement("option");
                option.value = role;
                option.textContent = role;
                roleSelect.appendChild(option);
            });
        }
    }

    // Nasconde tracker se gioco è COD
    const trackerInput = document.getElementById("tracker");
    if (game === "COD") {
        trackerInput.style.display = "none";
        trackerInput.disabled = true;
    } else {
        trackerInput.style.display = "block";
        trackerInput.disabled = false;
    }
}
userTypeSelect.addEventListener("change", updateFormFields);
gameSelect.addEventListener("change", updateFormFields);

// Submit form
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userType = userTypeSelect.value;
    const game = gameSelect.value;
    const name = document.getElementById("name").value.trim();
    const team = document.getElementById("team").value.trim();
    const id = document.getElementById("idGame").value.trim();
    const tracker = document.getElementById("tracker").value.trim();
    const discord = document.getElementById("discord").value.trim();
    const availability = document.getElementById("availability").value.trim();
    const notes = document.getElementById("notes").value.trim();
    const photoFile = document.getElementById("photo").files[0];

    let role = "";
    let rank = "";
    let stat = "";

    if (userType === "Player") {
        role = roleSelect.value;
        rank = rankInput.value.trim();
        stat = statInput.value.trim();
    }

    if (userType && game && name && team && id) {
        const newPlayer = { userType, game, name, team, id, tracker, discord, availability, notes, role, rank, stat, photo: "" };

        if (photoFile) {
            if (photoFile.size > 1024 * 1024) {
                alert("Foto troppo grande! Max 1MB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = async () => {
                newPlayer.photo = reader.result;
                const docRef = await db.collection("players").add(newPlayer);
                await docRef.update({ id: docRef.id });
                form.reset();
                updateFormFields();
            };
            reader.readAsDataURL(photoFile);
        } else {
            const docRef = await db.collection("players").add(newPlayer);
            await docRef.update({ id: docRef.id });
            form.reset();
            updateFormFields();
        }
    }
});

// Ascolto realtime database
function listenPlayers() {
    db.collection('players').onSnapshot(snapshot => {
        const players = [];
        snapshot.forEach(doc => players.push({ id: doc.id, ...doc.data() }));
        renderPlayers(players);
        updateDashboard(players);
    });
}

// Disegna tutti i player/coach
function renderPlayers(players) {
    const selectedGame = roleFilter.value;
    const search = searchInput.value.toLowerCase();
    playerList.innerHTML = "";

    const filtered = players.filter(p => {
        const gameMatch = selectedGame === "all" || (p.game && p.game === selectedGame);
        const team = p.team ? p.team.toLowerCase() : "";
        const name = p.name ? p.name.toLowerCase() : "";
        const searchMatch = team.includes(search) || name.includes(search);
        return gameMatch && searchMatch;
    });

    filtered.sort((a, b) => (a.team || "").localeCompare(b.team || "") || (a.name || "").localeCompare(b.name || ""));
    const teams = [...new Set(filtered.map(p => p.team || "Sconosciuto"))];

    teams.forEach(team => {
        const teamBlock = document.createElement("div");
        teamBlock.className = "team-block";
        teamBlock.dataset.team = team;

        teamBlock.addEventListener("dragover", e => e.preventDefault());
        teamBlock.addEventListener("dragenter", e => teamBlock.classList.add("drag-over"));
        teamBlock.addEventListener("dragleave", e => teamBlock.classList.remove("drag-over"));
        teamBlock.addEventListener("drop", async e => {
            teamBlock.classList.remove("drag-over");
            const draggedId = e.dataTransfer.getData("text/plain");
            await db.collection("players").doc(draggedId).update({ team: team });
        });

        const title = document.createElement("h2");
        title.textContent = `🏷️ Team: ${team}`;
        teamBlock.appendChild(title);

        filtered.filter(p => (p.team || "Sconosciuto") === team).forEach(player => {
            const card = document.createElement("div");
            card.className = "player-card";
            card.setAttribute("draggable", "true");
            card.addEventListener("dragstart", e => {
                e.dataTransfer.setData("text/plain", player.id);
            });

            const icon = player.userType === "Coach" ? "🧑‍🏫" : "🎮";
            const badgeHTML = player.role ? `<span class="badge">${player.role}</span>` : '';

            card.innerHTML = `
                ${player.photo ? `<img src="${player.photo}" alt="Foto">` : ""}
                <h3>${icon} ${player.name || "Sconosciuto"} ${badgeHTML}</h3>
                <p><strong>Gioco:</strong> ${player.game || "N/A"}</p>
                <p><strong>Team:</strong> ${player.team || "N/A"}</p>
                ${player.userType !== "Coach" ? `<p><strong>Ruolo:</strong> ${player.role || "N/A"}</p>` : ""}
                <p><strong>Discord:</strong> ${player.discord || "N/A"}</p>
                <p><strong>Disponibilità:</strong> ${player.availability || "N/A"}</p>
                ${player.userType !== "Coach" ? `<p><strong>Statistica:</strong> ${player.stat || "N/A"}</p>` : ""}
                ${player.userType !== "Coach" ? `<p><strong>Rank:</strong> ${player.rank || "N/A"}</p>` : ""}
                <p><strong>Note:</strong> ${player.notes || "N/A"}</p>
                <p><strong>Tracker:</strong> <a href="${player.tracker || "#"}" target="_blank">Link</a></p>
                <button onclick="editPlayer('${player.id}')">✏️ Modifica</button>
                <button onclick="confirmDelete('${player.id}')">🗑️ Elimina</button>
            `;
            teamBlock.appendChild(card);
        });

        playerList.appendChild(teamBlock);
    });

    const all = players.map(p => p.game || "Altro");
    const games = [...new Set(all)];
    roleFilter.innerHTML = '<option value="all">Tutti</option>' +
        games.map(game => `<option value="${game}">${game}</option>`).join("");
}

// Modifica player/coach
window.editPlayer = async function (id) {
    const doc = await db.collection('players').doc(id).get();
    if (!doc.exists) return;

    const player = doc.data();
    const updates = {};

    updates.name = prompt("Modifica Nome:", player.name) || player.name;
    updates.team = prompt("Modifica Team:", player.team) || player.team;
    updates.discord = prompt("Modifica Discord:", player.discord || "") || player.discord;
    updates.availability = prompt("Modifica Disponibilità:", player.availability || "") || player.availability;

    await db.collection('players').doc(id).update(updates);
};

// Elimina player/coach
window.confirmDelete = async function (id) {
    await db.collection('players').doc(id).delete();
};

// Dashboard aggiornata
function updateDashboard(players) {
    document.getElementById("totalUsers").textContent = players.length;
    document.getElementById("totalPlayers").textContent = players.filter(p => p.userType === "Player").length;
    document.getElementById("totalCoaches").textContent = players.filter(p => p.userType === "Coach").length;
    document.getElementById("codPlayers").textContent = players.filter(p => p.game === "COD").length;
    document.getElementById("valorantPlayers").textContent = players.filter(p => p.game === "Valorant").length;
    document.getElementById("rlPlayers").textContent = players.filter(p => p.game === "RL").length;
    document.getElementById("totalTeams").textContent = [...new Set(players.map(p => p.team || "Sconosciuto"))].length;
}

// Esporta CSV
document.getElementById("exportCSV").addEventListener("click", async () => {
    const snapshot = await db.collection('players').get();
    const players = [];
    snapshot.forEach(doc => players.push(doc.data()));

    if (players.length === 0) {
        alert("Non ci sono dati da esportare!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nome,Tipo Utente,Gioco,Team,Ruolo,ID Gioco,Tracker,Rank,Statistica,Discord,Disponibilità,Note\n";

    players.forEach(player => {
        const row = [
            player.name || "", player.userType || "", player.game || "", player.team || "", player.role || "",
            player.id || "", player.tracker || "", player.rank || "", player.stat || "",
            player.discord || "", player.availability || "", player.notes || ""
        ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gamepulse_players.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Riferimenti al Modale
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const closeModal = document.getElementById("closeModal");
const editName = document.getElementById("editName");
const editTeam = document.getElementById("editTeam");
const editDiscord = document.getElementById("editDiscord");
const editAvailability = document.getElementById("editAvailability");

let currentEditId = null;

// Funzione per aprire il Modale di Modifica
window.editPlayer = async function (id) {
    const doc = await db.collection('players').doc(id).get();
    if (!doc.exists) return;

    const player = doc.data();
    currentEditId = id;

    editName.value = player.name || "";
    editTeam.value = player.team || "";
    editDiscord.value = player.discord || "";
    editAvailability.value = player.availability || "";

    editModal.style.display = "block";
};

// Chiudi Modale
closeModal.addEventListener("click", () => {
    editModal.style.display = "none";
});

// Salva Modifiche
editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentEditId) return;

    const updatedData = {
        name: editName.value.trim(),
        team: editTeam.value.trim(),
        discord: editDiscord.value.trim(),
        availability: editAvailability.value.trim()
    };

    await db.collection('players').doc(currentEditId).update(updatedData);

    editModal.style.display = "none";
    currentEditId = null;
});


// Eventi live
roleFilter.addEventListener("change", () => listenPlayers());
searchInput.addEventListener("input", () => listenPlayers());

// Avvia ascolto realtime
listenPlayers();
