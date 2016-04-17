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

exports.builder = {
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
};

_.assign(exports.builder, config.options);

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
