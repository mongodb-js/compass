import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Aggregations from './components/aggregations';
import { Provider } from 'react-redux';
import configureStore, {
  refreshInput,
  setDataProvider,
  setNamespace,
  setServerVersion,
  setFields,
  setGlobalAppRegistry,
  setLocalAppRegistry
} from './stores';

class Plugin extends Component {
  static displayName = 'AggregationsPlugin';

  static propTypes = {
    store: PropTypes.object.isRequired,
    showExportButton: PropTypes.bool,
    showRunButton: PropTypes.bool,
    showExplainButton: PropTypes.bool,
  };

  static defaultProps = {
    showExportButton: false,
    showRunButton: false,
    showExplainButton: false,
  };

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={this.props.store}>
        <Aggregations
          showExportButton={this.props.showExportButton}
          showRunButton={this.props.showRunButton}
          showExplainButton={this.props.showExplainButton}
        />
      </Provider>
    );
  }
}

export default Plugin;
export {
  Plugin,
  configureStore,
  refreshInput,
  setDataProvider,
  setNamespace,
  setServerVersion,
  setFields,
  setGlobalAppRegistry,
  setLocalAppRegistry
};
