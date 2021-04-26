/* istanbul ignore file */

'use strict';
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Imports expansions written to disk to the process env so
 * we don't getting logging of our keys in Evergreen.
 */
const importExpansions = () => {
  if (!process.env.EVERGREEN_EXPANSIONS_PATH) {
    return;
  }

  const expansionsPath = path.resolve(process.env.EVERGREEN_EXPANSIONS_PATH);

  if (!fs.existsSync(expansionsPath)) {
    console.log({
      platform: os.platform(),
      cwd: process.cwd(),
      expansionsPath
    });

    throw new Error(`importExpansions failed: file ${expansionsPath} not found`);
  }

  const data = fs.readFileSync(expansionsPath, 'utf8');
  const expansions = YAML.parse(data);
  Object.keys(expansions).forEach((key) => {
    process.env[key.toUpperCase()] = expansions[key];
    if (process.env[key.toUpperCase() + '_OVERRIDE']) {
      process.env[key.toUpperCase()] = process.env[key.toUpperCase() + '_OVERRIDE'];
    }
  });

  console.info('Imported expansions:', Object.keys(expansions).join(', '));
}

importExpansions();
