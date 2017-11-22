import React, { Component } from 'react';
import Aggregations from 'components/aggregations';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'AggregationsPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Aggregations {...this.props} />
    );
  }
}

export default Plugin;
export { Plugin };
