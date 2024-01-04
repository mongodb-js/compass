#!/usr/bin/env node
const { sign } = require('./../dist');
const { program } = require('commander');

program
  .arguments('file')
  .option('-c, --client <value>', 'The signing client to use', 'local')
  .option(
    '-h, --host <value>',
    'The SSH host to use when signing with remote client.'
  )
  .option('-u, --username <value>', 'The SSH host username.')
  .option('-p, --port <value>', 'The SSH host port.')
  .option(
    '-k, --private-key <value>',
    'The SSH private key to use when signing with remote client.'
  )
  .parse(process.argv);

const { client, host, username, port, privateKey } = program.opts();
const file = program.args[0];

const options =
  client === 'remote' ? { host, username, port, privateKey } : undefined;
console.log('Signing file:', file, 'with client:', client, 'options:', options);
sign(file, client, options);
