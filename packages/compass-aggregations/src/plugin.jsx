import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Aggregations from './components/aggregations';
import { Provider } from 'react-redux';
import configureStore from './stores/store';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';
import { withPreferences } from 'compass-preferences-model';

class AggregationsPlugin extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
    enableImportExport: PropTypes.bool,
    enableAggregationBuilderRunPipeline: PropTypes.bool,
    enableExplainPlan: PropTypes.bool,
  };

  static defaultProps = {
    enableImportExport: false,
    enableAggregationBuilderRunPipeline: false,
    enableExplainPlan: false,
  };

  /**
   * Connect the Plugin to the store and render.
   */
  render() {
    return (
      <ConfirmationModalArea>
        <Provider store={this.props.store}>
          <Aggregations
            showExportButton={this.props.enableImportExport}
            showRunButton={this.props.enableAggregationBuilderRunPipeline}
            showExplainButton={this.props.enableExplainPlan}
          />
        </Provider>
      </ConfirmationModalArea>
    );
  }
}

const Plugin = withPreferences(
  AggregationsPlugin,
  [
    'enableImportExport',
    'enableAggregationBuilderRunPipeline',
    'enableExplainPlan',
  ],
  React
);

export default Plugin;
export { Plugin, configureStore };
