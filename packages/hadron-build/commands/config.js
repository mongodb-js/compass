'use strict';
const _ = require('lodash');
const cli = require('mongodb-js-cli')('hadron-build:config');
const config = require('../lib/config');
const Table = require('cli-table');
const yaml = require('js-yaml');
const inspect = require('util').inspect;

exports.command = 'config';

exports.describe = 'Configuration.';

exports.builder = {
  format: {
    choices: ['table', 'yaml', 'json'],
    description: 'What output format would you like?',
    default: 'table'
  }
};

_.assign(exports.builder, config.options);

const serialize = (CONFIG) => {
  return _.omitBy(CONFIG, function(value) {
    return _.isFunction(value) || _.isRegExp(value);
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
  /* eslint no-console: 0 */
  if (cli.argv.format === 'json') {
    console.log(JSON.stringify(serialize(CONFIG), null, 2));
  } else if (cli.argv.format === 'yaml') {
    console.log('---');
    console.log(yaml.dump(serialize(CONFIG)));
  } else {
    console.log(toTable(serialize(CONFIG)));
  }
};
