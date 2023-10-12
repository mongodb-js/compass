import { spawn } from 'child_process';

const ATLAS_SCRIPT_PATH = require.resolve('./atlascli.sh');

function parseAtlasResponse(text: string) {
  // Extract the connection string
  const connectionStringMatch = text.match(
    /Connection string: (mongodb:\/\/[^\n]+)/
  );
  const connectionString = connectionStringMatch
    ? connectionStringMatch[1]
    : '';

  return {
    connectionString,
  };
}

export function setupLocalAtlas(
  port: string,
  name: string
): Promise<ReturnType<typeof parseAtlasResponse>> {
  return new Promise((resolve, reject) => {
    let res = '';
    let error = '';

    const processStream = spawn('sh', [ATLAS_SCRIPT_PATH, 'setup', port, name]);

    processStream.stdout.setEncoding('utf8');
    processStream.stderr.setEncoding('utf8');

    processStream.stdout.on('data', (data: string) => {
      console.log(data);
      res = res.concat(data);
    });
    processStream.stderr.on('data', (data: string) => {
      error = error.concat(data);
    });

    processStream.on('close', () => {
      if (error) {
        return reject(error);
      } else {
        return resolve(parseAtlasResponse(res));
      }
    });
  });
}

export function tearDownLocalAtlas(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let res = '';
    let error = '';

    const processStream = spawn('sh', [ATLAS_SCRIPT_PATH, 'teardown', name]);

    processStream.stdout.setEncoding('utf8');
    processStream.stderr.setEncoding('utf8');

    processStream.stdout.on('data', (data: string) => {
      console.log(data);
      res = res.concat(data);
    });
    processStream.stderr.on('data', (data: string) => {
      error = error.concat(data);
    });

    processStream.on('close', (code) => {
      if (code === 0) {
        return resolve();
      } else {
        return reject(error);
      }
    });
  });
}
