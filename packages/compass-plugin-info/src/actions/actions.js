import Reflux from 'reflux';

const SecurityActions = Reflux.createActions([
  'show',
  'hide',
  'setup',
  'trust',
  'untrust'
]);

export default SecurityActions;
export { SecurityActions };
