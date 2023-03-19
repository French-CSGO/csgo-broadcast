// Retrieve info from the stream  
const { DemoFile } = require('demofile');
const { exit } = require('process');
const fs = require("fs");

async function getTeamsName(id) {
  try {
    const filePath = `./bin/${id}/config.json`;

    const df = new DemoFile();
    // Start parsing the stream now that we've added our event listeners
    df.parseBroadcast(`https://broadcast.white-gaming.fr/match/${id}`);

    df.gameEvents.on("weapon_fire", () => {
      console.log(df.teams[2].clanName)
      console.log(df.teams[3].clanName)
    
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Erreur lors de la lecture du fichier : ${err}`);
          exit(0);
        }
        let jsonObject = JSON.parse(data);

        jsonObject.team1 = df.teams[2].clanName;
        jsonObject.team2 = df.teams[3].clanName;

        const updatedJson = JSON.stringify(jsonObject, null, 2);

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

  } catch (err) {
    console.error(`Erreur : ${err}`);
  }
}

module.exports = getTeamsName;
