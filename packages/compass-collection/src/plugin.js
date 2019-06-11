import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Workspace from 'components/workspace';
import { Provider } from 'react-redux';
import store from 'stores';
import { isDataLakeChanged } from 'modules/is-data-lake';

class Plugin extends Component {
  static displayName = 'CollectionWorkspacePlugin';
  static propTypes = {
    isDataLake: PropTypes.bool
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    store.dispatch(isDataLakeChanged(this.props.isDataLake));
    return (
      <Provider store={store}>
        <Workspace />
      </Provider>
    );
  }
}

export default Plugin;
export { Plugin };
