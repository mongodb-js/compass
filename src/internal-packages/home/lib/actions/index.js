const Reflux = require('reflux');

const HomeActions = Reflux.createActions([
  'switchContent',
  'renderRoute'
]);

module.exports = HomeActions;
