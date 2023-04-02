const fs = require('fs');
const Demofile = require('demofile');

const demoFile = new Demofile();

demoFile.on('start', () => {
  console.log('Démarrage de la lecture de la démo...');
});

demoFile.on('teaminfo', (team) => {
  if (team.teamNum === 2) {
    console.log(`Nom de l'équipe CT : ${team.name}`);
  } else if (team.teamNum === 3) {
    console.log(`Nom de l'équipe T : ${team.name}`);
  }
});

demoFile.on('end', () => {
  console.log('Fin de la lecture de la démo');
});

fs.createReadStream('./bin/s90169322563318799t1676215356/3_start').pipe(demoFile);