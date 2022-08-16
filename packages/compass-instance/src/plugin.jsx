const React = require('react');
const { Provider, connect } = require('react-redux');
const store = require('./stores');
const { InstanceComponent } = require('./components/instance');
const { globalAppRegistryEmit } = require('@mongodb-js/mongodb-redux-common/app-registry');

const ConnectedInstanceComponent = connect((state) => state, {
  onTabClick(id) {
    return (dispatch, getState) => {
      const state = getState();
      // By emitting open-instance-workspace rather than change-tab directly,
      // the clicks on the tabs work the same way compared to when we select a
      // tab from the outside. That way things like the sidebar can be aware
      // that the instance tab is changing.
      dispatch(globalAppRegistryEmit('open-instance-workspace', state.tabs[id].name));
    };
  }
})(InstanceComponent);

const InstancePlugin = () => {
  return (
    <Provider store={store}>
      <ConnectedInstanceComponent />
    </Provider>
  );
};

module.exports = InstancePlugin;
