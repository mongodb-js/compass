#!/usr/bin/env node

var datasets = require('mongodb-datasets');
var fs = require('fs');
var MongoWritableStream = require('mongo-writable-stream');
var dest = new MongoWritableStream({
  url: 'mongodb://localhost:27017/scout-datasets',
  collection: 'users'
});

fs.createReadStream(__dirname + '/../users.json')
  .pipe(datasets.createGeneratorStream({
    size: 100
  }))
  .pipe(dest);
