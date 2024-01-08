#!/usr/bin/env node
const { sign } = require('@mongodb-js/signing-utils');
const yargs = require('yargs');

yargs
  .command('sign', 'Sign a file', (yargs) => {
    yargs
      .option('file', {
        description: 'File to sign',
        type: 'string',
        requiresArg: true,
      })
      .option('host', {
        description: 'SSH host',
        type: 'string',
      })
      .option('username', {
        description: 'SSH username',
        type: 'string',
      })
      .option('private-key', {
        description: 'SSH private-key',
        type: 'string',
      })
      .option('port', {
        description: 'SSH port',
        type: 'number',
      })
  }, async (argv) => {
    if (!argv.file) {
      throw new Error('Missing required argument: file');
    }
    await sign(argv.file, {
      host: argv.host,
      username: argv.username,
      privateKey: argv.privateKey,
      port: argv.port,
      client: 'remote',
      signingMethod: 'jsign',
    });
  })
  .help()
  .argv;

