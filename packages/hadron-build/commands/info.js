'use strict';
const _ = require('lodash');
const Target = require('../lib/target');
const verifyDistro = require('../lib/distro');
const Table = require('cli-table');
const yaml = require('js-yaml');
const inspect = require('util').inspect;
const flatten = require('flatnest').flatten;

exports.command = 'info';

exports.describe = 'Display project info.';

exports.builder = {
  verbose: {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  },
  format: {
    choices: ['table', 'yaml', 'json'],
    description: 'What output format would you like?',
    default: 'table'
  },
  flatten: {
    description: 'Flatten the config object into dot notation',
    type: 'boolean',
    default: false
  },
  dir: {
    description: 'Project root directory',
    default: process.cwd()
  }
};


const serialize = (target) => {
  return _.omitBy(target, function(value) {
    return _.isFunction(value) || _.isRegExp(value) || _.isUndefined(value);
  });
};

const toTable = (target) => {
  /**
   * Print the assembled `CONFIG` data as a nice table.
   */
  var configTable = new Table({
    head: ['Key', 'Value']
  });
  _.forIn(target, function(value, key) {
    configTable.push([key, inspect(value, {
      depth: null,
      colors: true
    })]);
  });
  return configTable.toString();
};

exports.handler = (argv) => {
  verifyDistro(argv);

  let target = new Target(argv.dir);

  if (argv.flatten) {
    target = flatten(target);
  }

  /* eslint no-console: 0, no-sync: 0 */
  if (argv.format === 'json') {
    console.log(JSON.stringify(serialize(target), null, 2));
  } else if (argv.format === 'yaml') {
    console.log(yaml.dump(serialize(target)));
  } else {
    console.log(toTable(serialize(target)));
  }
};
