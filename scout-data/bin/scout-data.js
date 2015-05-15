#!/usr/bin/env node

var datasets = require('mongodb-datasets');
var fs = require('fs');
var MongoWritableStream = require('mongo-writable-stream');
var dest = new MongoWritableStream({
  url: 'mongodb://localhost:27777/datasets',
  collection: 'users'
});

fs.createReadStream(__dirname + '/../users.json')
  .pipe(datasets.createGeneratorStream({
    size: 1000
  }))
  .pipe(dest);
