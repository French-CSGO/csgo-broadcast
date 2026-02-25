// Retrieve info from the stream  
const { DemoFile } = require('@laihoe/demoparser2');
const { exit } = require('process');
const fs = require("fs");
require('dotenv').config()

function getTeamsName(id) {

        const filePath = `./bin/${id}/config.json`;

        const df = new DemoFile();
        // Start parsing the stream now that we've added our event listeners
        df.parseBroadcast(`${process.env.URL}/match/${id}`);

        df.gameEvents.on("weapon_fire", () => {
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
            // parentPort.postMessage({ hello: workerData })

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

getTeamsName(
  ("s85568392926464965t1679436471")
  )
