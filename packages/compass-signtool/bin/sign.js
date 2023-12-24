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
  .option(
    '-k, --private-key <value>',
    'The SSH private key to use when signing with remote client.'
  )
  .parse(process.argv);

const { client, host, privateKey } = program.opts();
const file = program.args[0];

const options = client === 'remote' ? { host, privateKey } : {};
sign(file, client, options);
