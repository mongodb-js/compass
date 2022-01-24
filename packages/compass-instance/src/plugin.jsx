const React = require('react');
const { Provider, connect } = require('react-redux');
const store = require('./stores');
const { InstanceComponent } = require('./components/instance');

const ConnectedInstanceComponent = connect((state) => state, {
  onTabClick(id) {
    return { type: 'change-tab', id };
  },
})(InstanceComponent);

const InstancePlugin = () => {
  return (
    <Provider store={store}>
      <ConnectedInstanceComponent />
    </Provider>
  );
};

module.exports = InstancePlugin;
