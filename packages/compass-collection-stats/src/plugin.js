import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StoreConnector } from 'hadron-react-components';
import CollectionStats from 'components/collection-stats';

class Plugin extends Component {
  static displayName = 'CollectionStatsPlugin';

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
      <StoreConnector store={this.props.store}>
        <CollectionStats {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
export { Plugin };
