'use strict';

process.env.NODE_ENV = 'testing';

const Environment = require('../src/environment');
Environment.init();

const Connection = require('mongodb-connection-model');

const TEST_DATABASE = 'compass-test';
const TEST_COLLECTION = 'bands';
const TEST_CONNECTION = new Connection({ hostname: '127.0.0.1', port: 27018, ns: TEST_DATABASE });

/**
 * Test documents to sample with a local server.
 */
var DOCUMENTS = [
  { 'name': 'Aphex Twin' },
  { 'name': 'Bonobo' },
  { 'name': 'Arca' },
  { 'name': 'Beacon' }
];
