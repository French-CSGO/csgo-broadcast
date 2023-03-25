const fs = require('fs');

async function countAllFragments(id) {
  try {

    const filePath = `./bin/${id}/config.json`;
    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
          console.error(`Erreur lors de la lecture du fichier : ${err}`);
        }
        let jsonObject = JSON.parse(data);

        if (jsonObject.FullCount === undefined) {
          const files = await fs.promises.readdir(`./bin/${id}`);
          const fullFragments = files.filter(file => file.endsWith('_full'));
          jsonObject.FullCount = fullFragments.length;

          const updatedJson = JSON.stringify(jsonObject, null, 2);
    
        fs.writeFile(filePath, updatedJson, 'utf8', (err) => {
          if (err) {
            console.error(`Erreur lors de l'écriture du fichier : ${err}`);
          }
          console.log('Fichier JSON mis à jour avec succès.');
        });

        }
      });
  } catch (err) {
      console.error(err);
      throw err;
  }
}
  
module.exports = countAllFragments;