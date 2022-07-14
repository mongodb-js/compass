import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StoreConnector } from 'hadron-react-components';
import LegacyQueryBar from './components/legacy-query-bar';
import { QueryBar } from './components/query-bar/query-bar';

class Plugin extends Component {
  static displayName = 'QueryBarPlugin';
  static propTypes = {
    store: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
  };

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const useNewQueryBar = process?.env?.COMPASS_SHOW_NEW_TOOLBARS === 'true';

    return (
      <StoreConnector store={this.props.store}>
        {useNewQueryBar ? (
          <QueryBar
            toggleExpandQueryOptions={this.props.actions.toggleQueryOptions}
            toggleQueryHistory={this.props.actions.toggleQueryHistory}
            {...this.props}
          />
        ) : (
          <LegacyQueryBar actions={this.props.actions} {...this.props} />
        )}
      </StoreConnector>
    );
  }
}

export default Plugin;
export { Plugin };
