const fs = require('fs');

async function smallestFragment(id) {
    try {
        const files = await fs.promises.readdir(`../bin/${id}`);

        // Filter only the _full files
        const fullFragments = files.filter(file => file.includes('_full'));
        
        // Extract the numbers before the '_full' string
        const numbers = fullFragments.map(file => parseInt(file.split('_')[0]));
        
        // Sort the numbers in ascending order
        numbers.sort((a, b) => a - b);
        
        // Return the smallest number as an integer
        return parseInt(numbers[0]);
    } catch (err) {
        console.error(err);
        throw err;
    }
}
  
async function main() {
    try {
      const r = await smallestFragment('s72057594037927936t1679250071');
      console.log(`Smallest fragment as integer: ${r}`);
    } catch (err) {
      console.error(err);
    }
  }
  
  main();