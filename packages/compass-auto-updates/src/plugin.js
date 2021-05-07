import React, { Component } from 'react';
import { Provider } from 'react-redux';
import AutoUpdate from 'components/auto-update';
import store from 'stores';
import { connect } from 'react-redux';
import { cancelUpdate, visitReleaseNotes } from 'modules';

class Plugin extends Component {
  static displayName = 'AutoUpdatesPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <MappedAutoUpdate />
      </Provider>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  isVisible: state.isVisible,
  version: state.version
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedAutoUpdate = connect(
  mapStateToProps,
  {
    cancelUpdate,
    visitReleaseNotes
  },
)(AutoUpdate);

export default Plugin;
