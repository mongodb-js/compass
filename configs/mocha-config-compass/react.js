const path = require('path');
const base = require('.');

const pkgJson = require(path.join(process.cwd(), 'package.json'));

const isEnzyme = !!pkgJson.devDependencies.enzyme;

module.exports = {
  ...base,
  require: base.require.concat(
    [
      path.resolve(__dirname, 'register', 'jsdom-global-register.js'),
      path.resolve(__dirname, 'register', 'chai-dom-register.js'),
      path.resolve(__dirname, 'register', 'css-import-register.js'),
      // We want to move new components/plugins to use testing-library, but for
      // compat reasons will register and activate enzyme with adapters if
      // plugin is using it
      isEnzyme && path.resolve(__dirname, 'register', 'enzyme-register.js'),
    ].filter(Boolean)
  ),
};
