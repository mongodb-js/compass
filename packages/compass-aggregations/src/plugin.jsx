import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Aggregations from './components/aggregations';
import { Provider } from 'react-redux';
import configureStore from './stores';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';

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
      <ConfirmationModalArea>
        <Provider store={this.props.store}>
          <Aggregations
            showExportButton={this.props.showExportButton}
            showRunButton={this.props.showRunButton}
            showExplainButton={this.props.showExplainButton}
          />
        </Provider>
      </ConfirmationModalArea>
    );
  }
}

export default Plugin;
export { Plugin, configureStore };
