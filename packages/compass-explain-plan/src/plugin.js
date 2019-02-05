import React, { Component } from 'react';
import { Provider } from 'react-redux';
import ExplainPlan from 'components/explain-plan';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'ExplainPlanPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <ExplainPlan />
      </Provider>
    );
  }
}

export default Plugin;
