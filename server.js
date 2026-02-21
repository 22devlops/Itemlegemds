const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {}; // Храним игроков по id

io.on("connection", (socket) => {
    console.log("✅ Подключился:", socket.id);

    socket.on("joinBattle", (data) => {
        // Сохраняем данные игрока
        players[socket.id] = {
            id: socket.id,
            name: data.name,
            hp: data.health,
            maxHp: data.health,
            attack: data.attack
        };

        console.log(`Игрок ${data.name} вошел в поиск`);

        // Проверяем, есть ли с кем играть
        const allIds = Object.keys(players);
        if (allIds.length >= 2) {
            const p1Id = allIds[0];
            const p2Id = allIds[1];

            // Отправляем обоим данные о комнате
            const roomData = {};
            roomData[p1Id] = players[p1Id];
            roomData[p2Id] = players[p2Id];

            io.emit("playersUpdate", roomData);
            console.log("⚔️ Бой начался!");
        }
    });

    socket.on("doAttack", () => {
        const attackerId = socket.id;
        const allIds = Object.keys(players);
        const victimId = allIds.find(id => id !== attackerId);

        if (players[attackerId] && players[victimId]) {
            const damage = players[attackerId].attack;
            players[victimId].hp -= damage;

            console.log(`${players[attackerId].name} ударил ${players[victimId].name} на ${damage}`);

            io.emit("hitResult", {
                victimId: victimId,
                newHp: players[victimId].hp
            });

            if (players[victimId].hp <= 0) {
                io.emit("battleEnd", { winner: players[attackerId].name });
                players = {}; // Сброс игры
            }
        }
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        console.log("❌ Игрок вышел");
    });
});

server.listen(3000, "0.0.0.0", () => {
    console.log("🚀 СЕРВЕР 2.0 ЗАПУЩЕН!");
});
