// Retrieve info from the stream  
const { DemoFile } = require('demofile');
const { exit } = require('process');
const fs = require("fs");
require('dotenv').config()

const { workerData, parentPort } = require('worker_threads')

function getTeamsName(id) {

        const filePath = `./bin/${id}/config.json`;

        const df = new DemoFile();
        // Start parsing the stream now that we've added our event listeners
        console.log("[INIT] Lancement du parsing… URL =", `${process.env.URL}/match/${id}`);
                    
        df.parseBroadcast(`${process.env.URL}/match/${id}`);

        df.on("start", () => {
          console.log("[DEMOFILE] Parsing démarré");
        });
        
        df.on("end", () => {
          console.log("[DEMOFILE] Parsing terminé");
        });
        
        df.gameEvents.on("weapon_fire", () => {
          console.log("------ EVENT weapon_fire ------");

          // Vérifier structure teams
          console.log("[DEBUG] df.teams =", df.teams);

        // Vérifier si les indices existent
          console.log("[DEBUG] Team index 2 =", df.teams?.[2]);
          console.log("[DEBUG] Team index 3 =", df.teams?.[3]);
        
          // Essayer d’afficher leur clanName
          console.log("[DEBUG] team2 clanName =", df.teams?.[2]?.clanName);
          console.log("[DEBUG] team3 clanName =", df.teams?.[3]?.clanName);
        
          // Vérifier presence du fichier
          console.log("[FILE] Lecture du fichier :", filePath);

          console.log(df.teams[2].clanName)
          console.log(df.teams[3].clanName)
        
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              console.error(`Erreur lors de la lecture du fichier : ${err}`);
              exit(0);
            }
            let jsonObject = JSON.parse(data);

            jsonObject.team1 = df.teams[2].clanName.replace(/\[(NOT READY|READY)\]/g, "").trim();
            jsonObject.team2 = df.teams[3].clanName.replace(/\[(NOT READY|READY)\]/g, "").trim();

            const updatedJson = JSON.stringify(jsonObject, null, 2);
            parentPort.postMessage({ hello: workerData })

            fs.writeFile(filePath, updatedJson, 'utf8', (err) => {
              if (err) {
                console.error(`Erreur lors de l'écriture du fichier : ${err}`);
                exit(0);
              }
              console.log('Fichier JSON mis à jour avec succès.');
              exit(0);
            });
          });
        });
}

// Receive the id from the main thread
parentPort.postMessage(
  getTeamsName(
    workerData.id
  )
);

// Retrieve info from the stream
const { DemoFile } = require('demofile');
const fs = require("fs");
require('dotenv').config()

const { workerData, parentPort } = require('worker_threads')

function getTeamsName(id) {

  const filePath = `./bin/${id}/config.json`;

  const df = new DemoFile();

  //---------------------------------------------------
  // 🟦 DEBUG : LOGGER TOUTES LES ÉMISSIONS DEMOFILE
  //---------------------------------------------------
  const originalEmit = df.emit.bind(df);
  df.emit = (event, ...args) => {
    if (!["progress"].includes(event)) {
      console.log(`[DEMOFILE EVENT] ${event}`);
    }
    return originalEmit(event, ...args);
  };

  //---------------------------------------------------
  // 🟦 DEBUG : LOGGER TOUTES LES gameEvents
  //---------------------------------------------------
  const originalGameEmit = df.gameEvents.emit.bind(df.gameEvents);
  df.gameEvents.emit = (event, data) => {
    console.log(`[GAME EVENT] ${event}`, data ? JSON.stringify(data) : "");
    return originalGameEmit(event, data);
  };

  //---------------------------------------------------
  // 🟦 EVENTS GÉNÉRAUX (démarrage, fin, erreurs)
  //---------------------------------------------------
  df.on("start", () => {
    console.log("[DEMOFILE] Parsing démarré");
  });

  df.on("end", () => {
    console.log("[DEMOFILE] Parsing terminé");
  });

  df.on("error", (err) => {
    console.error("[DEMOFILE ERROR]", err);
  });

  //---------------------------------------------------
  // 🟦 DEBUG TEAMS À CHAQUE ROUND
  //---------------------------------------------------
  df.gameEvents.on("round_start", () => {
    console.log("-------------- DEBUG TEAMS --------------");
    console.log("df.teams =", df.teams);

    for (let i = 0; i < 5; i++) {
      console.log(`team[${i}] =`, df.teams?.[i]);
    }

    const getName = t => t?.clanName || t?.name || "???";

    console.log("Team0 :", getName(df.teams?.[0]));
    console.log("Team1 :", getName(df.teams?.[1]));
    console.log("Team2 :", getName(df.teams?.[2]));
    console.log("Team3 :", getName(df.teams?.[3]));
    console.log("-----------------------------------------");
  });

  //---------------------------------------------------
  // 🟦 EXEMPLE : ICI ON NE TOUCHE PAS AU FICHIER
  //---------------------------------------------------
  df.gameEvents.on("weapon_fire", () => {
    console.log("------ EVENT weapon_fire ------");
          
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              console.error(`Erreur lors de la lecture du fichier : ${err}`);
              exit(0);
            }
            let jsonObject = JSON.parse(data);
        
            jsonObject.team1 = df.teams[2].clanName.replace(/\[(NOT READY|READY)\]/g, "").trim();
            jsonObject.team2 = df.teams[3].clanName.replace(/\[(NOT READY|READY)\]/g, "").trim();
        
            const updatedJson = JSON.stringify(jsonObject, null, 2);
            parentPort.postMessage({ hello: workerData })
        
            fs.writeFile(filePath, updatedJson, 'utf8', (err) => {
              if (err) {
                console.error(`Erreur lors de l'écriture du fichier : ${err}`);
                exit(0);
              }
              console.log('Fichier JSON mis à jour avec succès.');
              exit(0);
            });
          });
  });

  //---------------------------------------------------
  // 🟦 LANCER LE PARSING APRÈS AVOIR MIS LES LISTENERS
  //---------------------------------------------------
  const url = `${process.env.URL}/match/${id}`;
  console.log("[INIT] Lancement du parsing… URL =", url);

  try {
    df.parseBroadcast(url);
  } catch (e) {
    console.error("[ERREUR parseBroadcast]", e);
  }
}


// Receive the id from the main thread
getTeamsName(workerData.id);
parentPort.postMessage({ started: true });
