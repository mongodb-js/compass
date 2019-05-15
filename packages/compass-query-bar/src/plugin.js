import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StoreConnector } from 'hadron-react-components';
import QueryBar from 'components/query-bar';

class Plugin extends Component {
  static displayName = 'QueryBarPlugin';
  static propTypes = {
    store: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={this.props.store}>
        <QueryBar actions={this.props.actions} {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
export { Plugin };
