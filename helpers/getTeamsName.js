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
        console.log("[INIT] Lancement du parsing… URL =", `${process.env.URL}/match/${id}`
                    
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
