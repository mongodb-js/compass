'use strict';
const fs = require('fs');
const path = require('path');

const { listAllPackages } = require('@mongodb-js/monorepo-tools');

for await (const props of listAllPackages()) {
  if (!fs.existsSync(path.resolve(props.location, '.prettierrc.json'))) {
    console.log(props.name);
  }
}
