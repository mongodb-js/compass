const path = require('path');
const execa = require('execa');
const { default: startServer } = require('verdaccio');

const monorepoPath = path.dirname(require.resolve('../../../package.json'));

const config = {
  'storage': './storage',
  'uplinks': {
    'npmjs': {
      'url': 'https://registry.npmjs.org/'
    }
  },
  'packages': {
    '@*/*': {
      'access': '$all',
      'publish': '$all',
      'proxy': 'npmjs'
    },
    '**': {
      'access': '$all',
      'publish': '$all',
      'proxy': 'npmjs'
    }
  },
  'logs': {
    'type': 'stdout',
    'level': 'error'
  }
};

startServer(config, 6000, config.storage, '1.0.0', 'verdaccio',
  (webServer, addr, pkgName, pkgVersion) => {
    console.log({pkgName, pkgVersion, port: addr.port, host: addr.host});

    webServer.listen(addr.port || addr.path, addr.host, async() => {
      console.log('verdaccio running');

      await execa('npx', [
        'lerna', 'publish', 'from-package',
        '--ignore-scripts',
        '--registry', `http://${addr.host}:${addr.port}`
        // , '--yes'
      ], {cwd: monorepoPath, stdio: 'inherit'});
    });
  });
