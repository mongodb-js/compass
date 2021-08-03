import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Workspace from './components/workspace';
import { Provider } from 'react-redux';
// import store from './stores';
import { isDataLakeChanged } from './modules/is-data-lake';
import createCollectionStore from './stores/store';

class Plugin extends Component {
  static displayName = 'CollectionWorkspacePlugin';
  static propTypes = {
    appRegistry: PropTypes.object.isRequired,
    databaseName: PropTypes.string.isRequired,
    collectionName: PropTypes.string.isRequired,
    dataService: PropTypes.object.isRequired,
    isDataLake: PropTypes.bool,
    updateNamespace: PropTypes.func.isRequired
    // store: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);

    const store = createCollectionStore(
      props.appRegistry,
      props.dataService,

      props.databaseName, // TODO: Remove.
      props.collectionName
    );

    // store={createCollectionStore}
    this.state = {
      store
    };
  }

  // state = {
  //   store={createCollectionStore}
  // }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const {
      store
    } = this.state;

    // TODO: Don't store isDataLake here and in many other plugins.
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
