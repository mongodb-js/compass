const fs = require('fs');
const path = require('path');

const debug = require('debug')('mongodb-compass:glossary');

function readPackage(packagePath) {
  fs.readdir(packagePath, (error, files) => {
    if (error) {
      debug(error);
    } else if (files.includes('stories.jsx')) {
      const filePath = path.join(packagePath, 'stories');
      require(filePath);
    }
  });
}

function readDirectoryContent(packagePath) {
  fs.stat(packagePath, (error, file) => {
    if (error) {
      debug(error);
    } else if (file.isDirectory()) {
      readPackage(packagePath);
    }
  });
}

function readPackages(packagesPath) {
  fs.readdir(packagesPath, (error, files) => {
    if (error) {
      debug(error);
    } else {
      files.forEach(file => {
        const packagePath = path.join(packagesPath, file);
        readDirectoryContent(packagePath);
      });
    }
  });
}

module.exports = readPackages;
