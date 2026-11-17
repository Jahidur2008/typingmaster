const { Server } = require("socket.io");
const Setting = require("../models/setting");

async function isMaintenanceActive() {
  try {
    const s = await Setting.findOne({ key: "site_config" }).lean();
    return Boolean(s && s.maintenanceMode);
  } catch {
    return false;
  }
}

const ENGLISH_TEXTS = [
  "The quick brown fox jumps over the lazy dog while the autumn leaves fall gently to the ground in a quiet afternoon breeze.",
  "Typing with precision and rhythm turns simple thoughts into rapid digital words that travel across the entire globe instantly.",
  "Every great typist begins with deliberate practice on the home row keys, mastering muscle memory before reaching supersonic speeds.",
  "Technology connects people from different horizons, allowing communities to build incredible software, share ideas, and race together.",
  "In the quiet corners of the keyboard, discipline and patience quietly carve the road from novice learner to grandmaster speed.",
  "Speed without accuracy is like a fast car with broken steering; true mastery balances quick reflexes with flawless precision.",
];

const BANGLA_TEXTS = [
  "আমাদের জন্মভূমি সোনার বাংলাদেশ নদীমাতৃক এক অপরূপ দেশ যেখানে সবুজ শ্যামল প্রকৃতি মনকে মুগ্ধ করে।",
  "নিয়মিত অনুশীলনের মাধ্যমেই যেকোনো জটিল কাজ সহজে আয়ত্ত করা যায় এবং টাইপিংয়ে দ্রুত গতি লাভ করা সম্ভব হয়।",
  "বাংলা আমাদের মাতৃভাষা এবং এর প্রতিটি বর্ণের মাঝে লুকিয়ে আছে আত্মত্যাগের গভীর ও গর্বিত ইতিহাস।",
  "প্রযুক্তির আলো এখন প্রতিটি ঘরে ঘরে ছড়িয়ে পড়েছে এবং নতুন প্রজন্ম তাদের মেধা দিয়ে বিশ্বকে সমৃদ্ধ করছে।",
  "ধৈর্য ও নিষ্ঠা থাকলে যেকোনো বড় স্বপ্ন একদিন সত্যে পরিণত হয় আর পরিশ্রম কখনোই বৃথা যায় না।",
];

function getRandomText(language = "english") {
  const pool = language === "bangla" ? BANGLA_TEXTS : ENGLISH_TEXTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// In-memory active race rooms
const rooms = new Map();

function setupCompetitionSocket(io) {
  io.on("connection", (socket) => {
    let currentRoomId = null;

    /**
     * Helper to serialize room for clients
     */
    function serializeRoom(room) {
      return {
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        hostId: room.hostId,
        status: room.status,
        language: room.language,
        wordCount: room.wordCount,
        text: room.text,
        countdown: room.countdown,
        startedAt: room.startedAt,
        players: Array.from(room.players.values()),
        rankings: room.rankings || [],
      };
    }

    /**
     * Leaves current room and handles cleanup / host migration
     */
    function leaveCurrentRoom() {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) {
        currentRoomId = null;
        return;
      }

      const leavingPlayer = room.players.get(socket.id);
      room.players.delete(socket.id);
      socket.leave(currentRoomId);

      if (room.players.size === 0) {
        // Clean up empty room
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        if (room.raceTimeout) clearTimeout(room.raceTimeout);
        rooms.delete(currentRoomId);
      } else {
        // Migrate host if host left
        if (room.hostId === socket.id) {
          const nextHost = room.players.values().next().value;
          if (nextHost) {
            room.hostId = nextHost.id;
            nextHost.isHost = true;
          }
        }
        io.to(currentRoomId).emit("room:player_left", {
          playerId: socket.id,
          playerName: leavingPlayer ? leavingPlayer.name : "Player",
          room: serializeRoom(room),
        });
      }

      currentRoomId = null;
    }

    // 1. Create Room
    socket.on("room:create", async ({ isPrivate = false, language = "english", user = {} } = {}, callback) => {
      if (await isMaintenanceActive()) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Typing Master is under maintenance. Multiplayer races are paused." });
        }
        return socket.emit("error_msg", { message: "Typing Master is under maintenance." });
      }

      leaveCurrentRoom();

      const roomId = generateRoomCode();
      const text = getRandomText(language);

      const hostPlayer = {
        id: socket.id,
        userId: user.id || user._id || null,
        name: user.name || "Host Typist",
        avatar: user.photo || user.avatar || "",
        country: user.country || "BD",
        level: user.level || 1,
        isHost: true,
        isReady: true,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        charsTyped: 0,
        finished: false,
        rank: null,
      };

      const room = {
        id: roomId,
        name: `${hostPlayer.name}'s Race`,
        isPrivate,
        hostId: socket.id,
        status: "waiting",
        language,
        wordCount: text.split(" ").length,
        text,
        countdown: 5,
        startedAt: null,
        endedAt: null,
        finishCount: 0,
        rankings: [],
        players: new Map([[socket.id, hostPlayer]]),
        countdownTimer: null,
        raceTimeout: null,
      };

      rooms.set(roomId, room);
      currentRoomId = roomId;
      socket.join(roomId);

      const serialized = serializeRoom(room);
      if (typeof callback === "function") {
        callback({ success: true, room: serialized });
      }
    });

    // 2. Join Room by Code
    socket.on("room:join", async ({ roomId, user = {} } = {}, callback) => {
      if (await isMaintenanceActive()) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Typing Master is under maintenance. Multiplayer races are paused." });
        }
        return socket.emit("error_msg", { message: "Typing Master is under maintenance." });
      }

      if (!roomId) {
        if (typeof callback === "function") callback({ success: false, error: "Room code is required" });
        return;
      }

      const cleanCode = roomId.trim().toUpperCase();
      const room = rooms.get(cleanCode);

      if (!room) {
        if (typeof callback === "function") callback({ success: false, error: "Race room not found or expired" });
        return;
      }

      if (room.status !== "waiting") {
        if (typeof callback === "function") callback({ success: false, error: "Race is already in progress" });
        return;
      }

      if (room.players.size >= 8) {
        if (typeof callback === "function") callback({ success: false, error: "Room is currently full (max 8 racers)" });
        return;
      }

      leaveCurrentRoom();

      const player = {
        id: socket.id,
        userId: user.id || user._id || null,
        name: user.name || `Racer ${room.players.size + 1}`,
        avatar: user.photo || user.avatar || "",
        country: user.country || "BD",
        level: user.level || 1,
        isHost: false,
        isReady: false,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        charsTyped: 0,
        finished: false,
        rank: null,
      };

      room.players.set(socket.id, player);
      currentRoomId = cleanCode;
      socket.join(cleanCode);

      const serialized = serializeRoom(room);
      io.to(cleanCode).emit("room:player_joined", { player, room: serialized });

      if (typeof callback === "function") {
        callback({ success: true, room: serialized });
      }
    });

    // 3. Quick Match
    socket.on("room:quick_match", async ({ user = {}, language = "english" } = {}, callback) => {
      if (await isMaintenanceActive()) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Typing Master is under maintenance. Multiplayer races are paused." });
        }
        return socket.emit("error_msg", { message: "Typing Master is under maintenance." });
      }

      // Find open public room
      let matchedRoom = null;
      for (const r of rooms.values()) {
        if (!r.isPrivate && r.status === "waiting" && r.players.size < 6 && r.language === language) {
          matchedRoom = r;
          break;
        }
      }

      if (matchedRoom) {
        // Join existing room
        leaveCurrentRoom();
        const player = {
          id: socket.id,
          userId: user.id || user._id || null,
          name: user.name || `Racer ${matchedRoom.players.size + 1}`,
          avatar: user.photo || user.avatar || "",
          country: user.country || "BD",
          level: user.level || 1,
          isHost: false,
          isReady: false,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          charsTyped: 0,
          finished: false,
          rank: null,
        };

        matchedRoom.players.set(socket.id, player);
        currentRoomId = matchedRoom.id;
        socket.join(matchedRoom.id);

        const serialized = serializeRoom(matchedRoom);
        io.to(matchedRoom.id).emit("room:player_joined", { player, room: serialized });

        if (typeof callback === "function") {
          callback({ success: true, room: serialized });
        }
      } else {
        // Create new public room
        leaveCurrentRoom();
        const roomId = generateRoomCode();
        const text = getRandomText(language);

        const hostPlayer = {
          id: socket.id,
          userId: user.id || user._id || null,
          name: user.name || "Speed Champion",
          avatar: user.photo || user.avatar || "",
          country: user.country || "BD",
          level: user.level || 1,
          isHost: true,
          isReady: true,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          charsTyped: 0,
          finished: false,
          rank: null,
        };

        const room = {
          id: roomId,
          name: `Public Race #${roomId.slice(0, 4)}`,
          isPrivate: false,
          hostId: socket.id,
          status: "waiting",
          language,
          wordCount: text.split(" ").length,
          text,
          countdown: 5,
          startedAt: null,
          endedAt: null,
          finishCount: 0,
          rankings: [],
          players: new Map([[socket.id, hostPlayer]]),
          countdownTimer: null,
          raceTimeout: null,
        };

        rooms.set(roomId, room);
        currentRoomId = roomId;
        socket.join(roomId);

        const serialized = serializeRoom(room);
        if (typeof callback === "function") {
          callback({ success: true, room: serialized });
        }
      }
    });

    // 4. Toggle Ready
    socket.on("room:toggle_ready", ({ roomId } = {}) => {
      const targetId = roomId || currentRoomId;
      const room = rooms.get(targetId);
      if (!room || room.status !== "waiting") return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.isReady = !player.isReady;
      io.to(targetId).emit("room:player_ready_toggled", {
        playerId: socket.id,
        isReady: player.isReady,
        room: serializeRoom(room),
      });
    });

    // 5. Start Race (Host only)
    socket.on("room:start_race", ({ roomId } = {}) => {
      const targetId = roomId || currentRoomId;
      const room = rooms.get(targetId);
      if (!room || room.status !== "waiting") return;
      if (room.hostId !== socket.id) return;

      room.status = "countdown";
      room.countdown = 5;
      room.finishCount = 0;
      room.rankings = [];

      // Reset all player stats
      for (const p of room.players.values()) {
        p.progress = 0;
        p.wpm = 0;
        p.accuracy = 100;
        p.charsTyped = 0;
        p.finished = false;
        p.rank = null;
      }

      io.to(targetId).emit("race:countdown_started", {
        countdown: room.countdown,
        room: serializeRoom(room),
      });

      if (room.countdownTimer) clearInterval(room.countdownTimer);

      room.countdownTimer = setInterval(() => {
        room.countdown -= 1;

        if (room.countdown > 0) {
          io.to(targetId).emit("race:countdown_tick", { countdown: room.countdown });
        } else {
          clearInterval(room.countdownTimer);
          room.countdownTimer = null;
          room.status = "racing";
          room.startedAt = Date.now();

          io.to(targetId).emit("race:started", {
            startedAt: room.startedAt,
            text: room.text,
            room: serializeRoom(room),
          });

          // Fallback safety timeout (60 seconds) to end race if someone leaves or stalls
          if (room.raceTimeout) clearTimeout(room.raceTimeout);
          room.raceTimeout = setTimeout(() => {
            if (room.status === "racing") {
              room.status = "finished";
              room.endedAt = Date.now();
              io.to(targetId).emit("race:over", {
                rankings: room.rankings,
                room: serializeRoom(room),
              });
            }
          }, 60000);
        }
      }, 1000);
    });

    // 6. Typing Progress
    socket.on("race:progress", ({ roomId, progress = 0, wpm = 0, accuracy = 100, charsTyped = 0 } = {}) => {
      const targetId = roomId || currentRoomId;
      const room = rooms.get(targetId);
      if (!room || room.status !== "racing") return;

      const player = room.players.get(socket.id);
      if (!player || player.finished) return;

      player.progress = Math.min(100, Math.max(0, Math.round(progress)));
      player.wpm = Math.round(wpm);
      player.accuracy = Math.round(accuracy * 10) / 10;
      player.charsTyped = charsTyped;

      socket.to(targetId).emit("race:progress_update", {
        playerId: socket.id,
        progress: player.progress,
        wpm: player.wpm,
        accuracy: player.accuracy,
        charsTyped: player.charsTyped,
      });
    });

    // 7. Player Finished
    socket.on("race:finish", ({ roomId, wpm = 0, accuracy = 100, timeSeconds = 0 } = {}, callback) => {
      const targetId = roomId || currentRoomId;
      const room = rooms.get(targetId);
      if (!room || (room.status !== "racing" && room.status !== "finished")) return;

      const player = room.players.get(socket.id);
      if (!player || player.finished) return;

      room.finishCount += 1;
      const rank = room.finishCount;

      player.finished = true;
      player.progress = 100;
      player.wpm = Math.round(wpm);
      player.accuracy = Math.round(accuracy * 10) / 10;
      player.finishTime = timeSeconds;
      player.rank = rank;

      const resultEntry = {
        playerId: player.id,
        userId: player.userId,
        name: player.name,
        avatar: player.avatar,
        country: player.country,
        rank,
        wpm: player.wpm,
        accuracy: player.accuracy,
        timeSeconds: player.finishTime,
        xpReward: rank === 1 ? 100 : rank === 2 ? 65 : rank === 3 ? 40 : 20,
      };

      room.rankings.push(resultEntry);

      io.to(targetId).emit("race:player_finished", {
        result: resultEntry,
        room: serializeRoom(room),
      });

      if (typeof callback === "function") {
        callback({ success: true, rank, xpReward: resultEntry.xpReward });
      }

      // Check if all active players finished
      const allFinished = Array.from(room.players.values()).every((p) => p.finished);
      if (allFinished) {
        if (room.raceTimeout) clearTimeout(room.raceTimeout);
        room.status = "finished";
        room.endedAt = Date.now();

        io.to(targetId).emit("race:over", {
          rankings: room.rankings,
          room: serializeRoom(room),
        });
      }
    });

    // 8. Rematch / Play Again
    socket.on("race:rematch", ({ roomId } = {}) => {
      const targetId = roomId || currentRoomId;
      const room = rooms.get(targetId);
      if (!room) return;
      if (room.hostId !== socket.id) return;

      if (room.countdownTimer) clearInterval(room.countdownTimer);
      if (room.raceTimeout) clearTimeout(room.raceTimeout);

      room.status = "waiting";
      room.countdown = 5;
      room.finishCount = 0;
      room.rankings = [];
      room.text = getRandomText(room.language);
      room.wordCount = room.text.split(" ").length;

      for (const p of room.players.values()) {
        p.isReady = p.isHost;
        p.progress = 0;
        p.wpm = 0;
        p.accuracy = 100;
        p.charsTyped = 0;
        p.finished = false;
        p.rank = null;
      }

      io.to(targetId).emit("race:rematch_ready", { room: serializeRoom(room) });
    });

    // 9. Leave Room
    socket.on("room:leave", () => {
      leaveCurrentRoom();
    });

    // 10. Disconnect
    socket.on("disconnect", () => {
      leaveCurrentRoom();
    });
  });
}

module.exports = { setupCompetitionSocket };
