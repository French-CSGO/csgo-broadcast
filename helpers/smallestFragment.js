const fs = require('fs');

function smallestFragment(id) {
    fs.readdir(`./bin/${id}`, (err, files) => {
        if (err) {
          console.error(err);
          return;
        }
      
        // Filter only the _full files
        const fullFragments = files.filter(file => file.includes('_full'));
      
        // Extract the numbers before the '_full' string
        const numbers = fullFragments.map(file => parseInt(file.split('_')[0]));
      
        // Sort the numbers in ascending order
        numbers.sort((a, b) => a - b);
      
        // Print the smallest number
        console.log(`Smallest fragment is : ${numbers[0]}`);
    });
}
  
module.exports = smallestFragment;