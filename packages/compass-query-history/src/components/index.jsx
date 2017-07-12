const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const QueryHistorySidebarComponent = require('./query-history-sidebar-component');
const Store = require('../stores');
const Actions = require('../actions');

const debug = require('debug')('mongodb-compass:query-history:index');

class ConnectedQueryHistoryComponent extends React.Component {
  /**
   * Connect QueryHistorySidebarComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <QueryHistorySidebarComponent
          actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedQueryHistoryComponent.displayName = 'ConnectedQueryHistoryComponent';

module.exports = ConnectedQueryHistoryComponent;
