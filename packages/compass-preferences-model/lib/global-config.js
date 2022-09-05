const bson = require('bson');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const getGlobalConfigPaths = () => {
  const paths = [];

  if (process.env.COMPASS_GLOBAL_CONFIG_FILE_FOR_TESTING) {
    paths.push(process.env.COMPASS_GLOBAL_CONFIG_FILE_FOR_TESTING);
  }

  switch (process.platform) {
    case 'win32':
      if (process.execPath === process.argv[1]) {
        paths.push(path.resolve(process.execPath, '..', 'mongodb-compass.cfg'));
      }
      return paths;
    default:
      paths.push('/etc/mongodb-compass.conf');
      return paths;
  }
};

const loadGlobalConfig = async() => {
  const globalConfigPaths = getGlobalConfigPaths();

  let file = '';
  let config = {};

  for (const filename of globalConfigPaths) {
    try {
      file = await fs.promises.readFile(filename, 'utf8');
      break;
    } catch (error) {
      /* log the error */
    }
  }

  try {
    if (file.trim().startsWith('{')) {
      config = bson.EJSON.parse(file);
    } else {
      config = yaml.load(file);
    }
  } catch (error) {
    /* log the error */
  }

  return config;
};

module.exports = {
  getGlobalConfigPaths,
  loadGlobalConfig
};
