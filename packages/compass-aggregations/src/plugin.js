import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Aggregations from 'components/aggregations';
import { Provider } from 'react-redux';
import configureStore, {
  refreshInput,
  setDataProvider,
  setNamespace,
  setServerVersion,
  setFields,
  setAppRegistry
} from 'stores';

class Plugin extends Component {
  static displayName = 'AggregationsPlugin';

  static propTypes = {
    store: PropTypes.object.isRequired
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    console.log('Plugin#render()', this.props);
    return (
      <Provider store={this.props.store}>
        <Aggregations />
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
  setAppRegistry
};
