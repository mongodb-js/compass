#!/usr/bin/env node

require('../')({}, function(err) {
  if (err) {
    return console.error(err);
  }
  process.exit(0);
});
