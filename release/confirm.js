const readline = require('readline');

function confirm(prompt) {
  return new Promise((resolve, reject) => {
    try {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(`${prompt} Y/[N]: `, (answer) => {
        rl.close();
        resolve(answer.match(/^[yY]$/));
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = confirm;
