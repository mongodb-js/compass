const fs = require('fs');
const path = require('path');

const { forEachPackage } = require('@mongodb-js/monorepo-tools');

forEachPackage((props) => {
  if (!fs.existsSync(path.resolve(props.location, '.prettierrc.json'))) {
    console.log(props.name);
  }
});
