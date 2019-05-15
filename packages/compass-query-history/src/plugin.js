import React, { Component } from 'react';
import { StoreConnector } from 'hadron-react-components';
import QueryHistory from 'components/query-history';
import PropTypes from 'prop-types';

class Plugin extends Component {
  static displayName = 'QueryHistoryPlugin';
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
        <QueryHistory actions={this.props.actions} {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
export { Plugin };
