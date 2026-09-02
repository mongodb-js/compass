#!/usr/bin/env node
/* eslint-disable */
'use strict';
const fs = require('fs');

// Instead of opening the OIDC auth URL in the system browser (like Compass
// would do through `shell.openExternal`), capture it to a file so that the e2e
// test can drive the login page itself with a WebdriverIO session.
//
// The destination file path is provided through the OIDC_AUTH_URL_FILE env var.
(function () {
  const url = process.argv[2];
  const file = process.env.OIDC_AUTH_URL_FILE;
  if (!file) {
    throw new Error('OIDC_AUTH_URL_FILE env variable is not set');
  }
  fs.writeFileSync(file, url, 'utf8');
})();
