const { execSync, execFileSync } = require('child_process');
const readline = require('readline');

function getLatestVersion() {
  return execSync(`npm view @mongosh/cli-repl .dist-tags.latest`).toString().trim();
}

function gitClone(repo, dest) {
  return execFileSync('git', ['clone', repo, dest]);
}

function confirm(prompt) {
  return new Promise((resolve) => {
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

module.exports = {
  getLatestVersion,
  gitClone,
  confirm
};
