import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import ExplainPlan from 'components/explain-plan';

class Plugin extends Component {
  static displayName = 'ExplainPlanPlugin';
  static propTypes = {
    store: PropTypes.object.isRequired
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={this.props.store}>
        <ExplainPlan />
      </Provider>
    );
  }
}

export default Plugin;
