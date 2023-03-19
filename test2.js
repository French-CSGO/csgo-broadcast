// Retrieve info from the stream  
const { DemoFile } = require('demofile');

function parseDemoFile(url) {
  const df = new DemoFile();
  // Start parsing the stream now that we've added our event listeners
  df.parseBroadcast(url);

  df.on('start', () => {
    console.log('Démarrage de la lecture de la démo...');
  });
  
  df.gameEvents.on("round_start", () => {
    console.log("DATA")
    console.log(df.teams[2].clanName)
    console.log(df.teams[3].clanName)
  });
}

// parseDemoFile("https://broadcast.white-gaming.fr/match/s85568392924973895t1679157279");
// parseDemoFile("https://broadcast.white-gaming.fr/match/s85568392924973895t1679157279");
parseDemoFile("https://csgo.zettalab.net/match/s90170520667399182t1679166310");