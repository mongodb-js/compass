const fs = require('fs');
const path = require('path');

const { forEachPackage } = require('./for-each-package');

forEachPackage((props) => {
  if (!fs.existsSync(path.resolve(props.location, '.prettierrc.json'))) {
    console.log(props.name);
  }
});
