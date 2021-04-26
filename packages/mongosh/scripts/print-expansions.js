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
const printExpansions = () => {
  const filter = process.argv.slice(2);

  if (!process.env.EVERGREEN_EXPANSIONS_PATH) {
    return;
  }

  const expansionsPath = path.resolve(process.env.EVERGREEN_EXPANSIONS_PATH);

  if (!fs.existsSync(expansionsPath)) {
    console.error({
      platform: os.platform(),
      cwd: process.cwd(),
      expansionsPath
    });

    throw new Error(`printExpansions failed: file ${expansionsPath} not found`);
  }

  const data = fs.readFileSync(expansionsPath, 'utf8');
  const expansions = YAML.parse(data);

  console.log(
    Object.keys(expansions)
      .filter((expansion) => filter.length === 0 || filter.includes(expansion))
      .map((key) => `${key.toUpperCase()}="${expansions[key]}"`)
      .join('\n')
  );
};

printExpansions();
