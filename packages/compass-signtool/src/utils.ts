export const debug = console.log;

export function assertRequiredVars() {
  [
    'GARASIGN_USERNAME',
    'GARASIGN_PASSWORD',
    'DOCKER_ARTIFACTORY_USERNAME',
    'DOCKER_ARTIFACTORY_PASSWORD',
  ].forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} is required`);
    }
  });
}
