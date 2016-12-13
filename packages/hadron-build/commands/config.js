'use strict';
const _ = require('lodash');
const cli = require('mongodb-js-cli')('hadron-build:config');
const config = require('../lib/config');
const Table = require('cli-table');
const yaml = require('js-yaml');
const inspect = require('util').inspect;
const fs = require('fs');
const flatten = require('flatnest').flatten;

exports.command = 'config';

exports.describe = 'Configuration.';

exports.builder = (yargs) => {
  const electronPrebuiltVersion = require('electron-prebuilt/package.json').version;
  const pkg = require('../lib/package');
  var opts = {
    verbose: {
      describe: 'Confused or trying to track down a bug and want lots of debug output?',
      type: 'boolean',
      default: false
    },
    platform: {
      describe: 'What platform are we building for?',
      choices: ['win32', 'linux', 'darwin'],
      default: process.platform
    },
    arch: {
      describe: 'What platform architecture are we building for?',
      choices: ['x64', 'x86'],
      default: process.arch
    },
    electron_version: {
      describe: 'What version of electron are we using?',
      default: electronPrebuiltVersion
    },
    version: {
      describe: 'What version of the application are we building?',
      default: process.env.npm_package_version || pkg.version
    },
    name: {
      describe: 'What is the kebab cased name of the application?',
      default: process.env.npm_package_name || pkg.name
    },
    product_name: {
      describe: 'What is the name of the application we should display to humans?',
      default: pkg.productName || pkg.name
    },
    description: {
      describe: 'What is the description of the application we should display to humans?',
      default: process.env.npm_package_description || pkg.description
    },
    sign: {
      describe: 'Should this build be signed?',
      type: 'boolean',
      default: true
    },
    signtool_params: {
      describe: 'What extra cli arguments should be passed to signtool.exe?',
      default: process.env.SIGNTOOL_PARAMS || null
    },
    favicon_url: {
      description: 'A URL to an ICO file to use as the application icon (e.g. Windows: displayed in Control Panel > Programs and Features)',
      default: _.get(pkg, 'config.hadron.build.win32.favicon_url')
    },
    evergreen_revision: {
      description: 'What revision, aka commit sha1 is evergreen building?',
      type: 'string',
      default: process.env.EVERGREEN_REVISION
    },
    evergreen_build_variant: {
      description: 'build_variant on evergreen',
      type: 'string',
      default: process.env.EVERGREEN_BUILD_VARIANT
    },
    evergreen_branch_name: {
      description: 'branch_name on evergreen',
      type: 'string',
      default: process.env.EVERGREEN_BRANCH_NAME
    },
    github_token: {
      description: 'GitHub API token.',
      default: process.env.GITHUB_TOKEN
    },
    github_owner: {
      default: pkg.github_owner
    },
    github_repo: {
      default: pkg.github_repo
    },
    author: {
      default: pkg.author || pkg.authors
    }
  };
  _.assign(opts, {
    format: {
      choices: ['table', 'yaml', 'json'],
      description: 'What output format would you like?',
      default: 'table'
    },
    out: {
      description: 'Output to a file'
    },
    flatten: {
      description: 'Flatten the config object into dot notation',
      type: 'boolean',
      default: false
    }
  });
  return yargs.options(opts);
};

// _.assign(exports.builder, config.options);

const serialize = (CONFIG) => {
  return _.omitBy(CONFIG, function(value) {
    return _.isFunction(value) || _.isRegExp(value) || _.isUndefined(value);
  });
};

const toTable = (CONFIG) => {
  /**
   * Print the assembled `CONFIG` data as a nice table.
   */
  var configTable = new Table({
    head: ['Key', 'Value']
  });
  _.forIn(CONFIG, function(value, key) {
    configTable.push([key, inspect(value, {
      depth: null,
      colors: true
    })]);
  });
  return configTable.toString();
};

exports.handler = (argv) => {
  cli.argv = argv;

  let CONFIG = config.get(cli);

  if (argv.flatten) {
    CONFIG = flatten(CONFIG);
  }
  let res = '';

  /* eslint no-console: 0, no-sync: 0 */
  if (cli.argv.format === 'json') {
    res = JSON.stringify(serialize(CONFIG), null, 2);
  } else if (cli.argv.format === 'yaml') {
    res = yaml.dump(serialize(CONFIG));
  } else {
    res = toTable(serialize(CONFIG));
  }

  if (argv.output) {
    return fs.writeFileSync(argv.output, res);
  }

  console.log(res);
};
