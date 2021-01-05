/* eslint-disable no-console */
const { execSync } = require('child_process');
const fs = require('fs');

const dockerEnvsPath = '/tmp/compass-connectivity-docker-test-envs';
const dockerEnvsRepo = 'git@github.com:mongodb-js/devtools-docker-test-envs.git';

const dockerComposeFile = 'replica-set/docker-compose.yaml';

const directoryExists = (directoryPath) => {
  // eslint-disable-next-line no-sync
  return fs.existsSync(directoryPath) && fs.lstatSync(directoryPath).isDirectory();
};

const cloneDockerEnvsRepo = () => {
  if (directoryExists(dockerEnvsPath)) {
    execSync(`rm -Rf ${dockerEnvsPath}`);
  }

  execSync(`git clone ${dockerEnvsRepo} ${dockerEnvsPath}`);
};

module.exports.dockerComposeUp = () => {
  console.log('Starting up the docker instance...');

  // 1. Clone the docker images repo.
  cloneDockerEnvsRepo();

  // 2. Checkout to the commit of the docker images repo we know.
  execSync(
    'git -c advice.detachedHead=false checkout de257688e6b7ce265a70bf75c7127c6da0bf2cf0',
    {
      cwd: dockerEnvsPath,
      stdio: 'inherit'
    }
  );

  // 3. Start our docker image.
  execSync(`docker-compose -f ${dockerComposeFile} up -d`, {
    cwd: dockerEnvsPath,
    stdio: 'inherit'
  });

  console.log('Docker instance started.');
};

module.exports.dockerComposeDown = () => {
  console.log('Shutting down docker instance...');

  execSync(`docker-compose -f ${dockerComposeFile} down`, {
    cwd: dockerEnvsPath,
    stdio: 'inherit'
  });

  console.log('Docker instance was shutdown.');
};

