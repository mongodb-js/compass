#!/usr/bin/env node

/* eslint no-sync:0, no-console:0 */
var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var figures = require('figures');
var toMarkdownTable = require('markdown-table');
var es = require('event-stream');
var csvWriter = require('csv-write-stream');

var usage = fs.readFileSync(path.resolve(__dirname, '../usage.txt')).toString();
var args = require('minimist')(process.argv.slice(2), {
  boolean: ['debug', 'csv', 'json', 'markdown']
});

if (args.debug) {
  process.env.DEBUG = 'electron-license';
}
var license = require('../');
var pkg = require('../package.json');

var command = args._[0] || 'build';

if (args.help || args.h) {
  console.error(usage);
  process.exit(1);
}

if (args.version) {
  console.error(pkg.version);
  process.exit(1);
}

if (command === 'check') {
  license.check(args, function(err, deps) {
    if (err) {
      console.error(err.stack);
      process.exit(1);
    }

    if (deps.length === 0) {
      console.log(chalk.green.bold(figures.tick),
        ' All project dependencies have correct license data');
      process.exit(0);
      return;
    }

    console.log(chalk.red.bold(figures.cross),
      ' ' + deps.length + ' dependencies require manual license overrides:\n');
    deps.map(function(d) {
      console.log(chalk.gray('- [' + chalk.white(d.id) + '](' + d.url
        + '): license is `' + chalk.bold.red(d.license) + '`'));
    });

    process.exit(1);
  });
  return;
}

if (command === 'list') {
  license.list(args, function(err, deps) {
    if (err) {
      console.error(err.stack);
      process.exit(1);
    }

    if (args.json) {
      console.log(JSON.stringify(deps, null, 2));
      return;
    }

    var rows = [
      ['Name', 'URL', 'License']
    ];

    deps.map(function(d) {
      rows.push([d.id, d.url, d.license]);
    });


    if (args.csv) {
      var headers = rows.shift();
      es.readArray(rows)
        .pipe(csvWriter({
          headers: headers
        }))
        .pipe(process.stdout);
      return;
    }

    console.log(toMarkdownTable(rows));
  });
  return;
}

license.build(args, function(err, res) {
  if (err) {
    console.error(err.stack);
    process.exit(1);
  }

  console.log(res);
});
