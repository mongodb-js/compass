'use strict';
const path = require('path');
const base = require('.');

const pkgJson = require(path.join(process.cwd(), 'package.json'));

const isEnzyme = !!pkgJson.devDependencies.enzyme;

module.exports = {
  ...base,
  require: [
    // There is a bug with React tests not exiting due to how React uses
    // MessageChannel. The bug is fixed in react@17.1.0, but in the meantime we
    // have to have this script around and it needs to be the absolute first
    // import
    // https://github.com/facebook/react/issues/20756#issuecomment-780927519
    require.resolve('react-16-node-hanging-test-fix'),
    ...base.require,
    path.resolve(__dirname, 'register', 'jsdom-global-register.js'),
    path.resolve(__dirname, 'register', 'chai-dom-register.js'),
    path.resolve(__dirname, 'register', 'css-import-register.js'),
    // We want to move new components/plugins to use testing-library, but for
    // compat reasons will register and activate enzyme with adapters if
    // plugin is using it
    isEnzyme && path.resolve(__dirname, 'register', 'enzyme-register.js'),
  ].filter(Boolean),
};
