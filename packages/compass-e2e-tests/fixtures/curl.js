#!/usr/bin/env node
/* eslint-disable */
'use strict';
const fetch = require('node-fetch');

// fetch() an URL and ignore the response body
(async function () {
  (await fetch(process.argv[2])).body?.resume();
})().catch((err) => {
  process.nextTick(() => {
    throw err;
  });
});
