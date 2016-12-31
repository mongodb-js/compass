const Reflux = require('reflux');

const HomeActions = Reflux.createActions([
  'switchContent',
  'renderRoute',
  'navigateRoute'
]);

module.exports = HomeActions;
