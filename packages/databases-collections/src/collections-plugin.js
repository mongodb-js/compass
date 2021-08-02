import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';

import CollectionsPlugin from './components/collections';
import store, { loadDatabase } from './stores/collections-store';

class Plugin extends Component {
  static displayName = 'CollectionsPlugin';

  static propTypes = {
    databaseName: PropTypes.string.isRequired,
    updateNamespace: PropTypes.func.isRequired
  }

  componentDidMount() {
    // TODO: Isolation for this component, not global store
    loadDatabase(this.props.databaseName);
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <CollectionsPlugin
          databaseName={this.props.databaseName}
          updateNamespace={this.props.updateNamespace}
        />
      </Provider>
    );
  }
}

export default Plugin;
