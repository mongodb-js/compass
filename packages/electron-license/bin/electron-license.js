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
  boolean: ['production', 'debug', 'csv', 'json', 'markdown']
});

if (args.debug) {
  process.env.DEBUG = 'electron-license';
}
var license = require('../');
var pkg = require('../package.json');

var command = args._[0] || 'build';

args.excludeOrg = args.exclude_org;

if (args.help || args.h) {
  console.error(usage);
  process.exit(1);
}

if (args.version) {
  console.error(pkg.version);
  process.exit(1);
}

if (command === 'check') {
  license.check(args)
    .then( (deps) => {
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
    })
    .catch( (err) => {
      console.error(err.stack);
      process.exit(1);
    });
  return;
}

if (command === 'list') {
  license.list(args)
    .then( (deps) => {
      if (args.json) {
        console.log(JSON.stringify(deps, null, 2));
        return;
      }

      var rows = [
        ['Name', 'URL', 'License']
      ];

      deps.map(function(d) {
        rows.push([d.name, d.url, d.license]);
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
    })
    .catch( (err) => {
      console.error(err.stack);
      process.exit(1);
    });
  return;
}

if (command === 'third-party-notices') {
  license.thirdPartyNotices(args)
    .then( (res) => console.log(res))
    .catch( (err) => {
      console.error(err.stack);
      process.exit(1);
    });
  return;
}

license.build(args)
  .then( (res) => console.log(res))
  .catch( (err) => {
    console.error(err.stack);
    process.exit(1);
  });
