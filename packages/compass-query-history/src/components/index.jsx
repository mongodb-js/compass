const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const SidebarComponent = require('./sidebar-component');
const SidebarStore = require('../stores/sidebar-store');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:query-history:index');

class QueryHistoryComponent extends React.Component {
  /**
   * Connect SidebarComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
        <StoreConnector store={SidebarStore}>
          <SidebarComponent
            actions={Actions} {...this.props} />
        </StoreConnector>
    );
  }
}

QueryHistoryComponent.displayName = 'QueryHistoryComponent';

module.exports = QueryHistoryComponent;
