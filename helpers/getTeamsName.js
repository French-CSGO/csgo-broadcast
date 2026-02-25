const { DemoFile } = require('@laihoe/demoparser2');
const { workerData, parentPort } = require("worker_threads");
require("dotenv").config();

function debugBroadcast(id) {
  const df = new DemoFile();

  const url = `${process.env.URL}/match/${id}`;

  console.log("==========================================");
  console.log("[DEBUG] Lancement du broadcast");
  console.log("[DEBUG] URL =", url);
  console.log("==========================================");

  //--------------------------------------------------------
  // 0. LOG EVERY EVENT EMITTED BY THE DEMOFILE INSTANCE
  //--------------------------------------------------------
  const origEmit = df.emit;
  df.emit = function(event, ...args) {
    console.log(`📡 [DEMOFILE EMIT] ${event}`, args?.[0] || "");
    return origEmit.call(this, event, ...args);
  };

  //--------------------------------------------------------
  // 1. GAME EVENTS
  //--------------------------------------------------------
  const gameOrigEmit = df.gameEvents.emit;
  df.gameEvents.emit = function(event, data) {
    console.log(`🎮 [GAME EVENT] ${event}`, data || "");
    return gameOrigEmit.call(this, event, data);
  };

  //--------------------------------------------------------
  // 2. EVENTS DÉCLARÉS PAR LA DOC
  //--------------------------------------------------------
  df.on("start", () => console.log("🚀 [DEMOFILE] start"));
  df.on("end", () => console.log("🏁 [DEMOFILE] end"));
  df.on("error", (err) => console.log("❌ [DEMOFILE] error:", err));

  //--------------------------------------------------------
  // 3. Lancer le stream
  //--------------------------------------------------------
  df.parseBroadcast(url)
    .then(() => {
      console.log("🏁 [BROADCAST] parseBroadcast terminé.");
      parentPort.postMessage({ done: true });
    })
    .catch((err) => {
      console.error("❌ [BROADCAST] ERREUR parseBroadcast:", err);
      parentPort.postMessage({ error: err.toString() });
    });
}

debugBroadcast(workerData.id);
parentPort.postMessage({ started: true });

