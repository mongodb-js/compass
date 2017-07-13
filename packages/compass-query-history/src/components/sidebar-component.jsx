const React = require('react');
const HeaderComponent = require('./header-component');
const RecentListComponent = require('./recent-list-component');
const FavoritesListComponent = require('./favorites-list-component');
const HeaderStore = require('../stores/header-store');
const RecentListStore = require('../stores/recent-list-store');
const FavoritesListStore = require('../stores/favorites-list-store');
const { StoreConnector } = require('hadron-react-components');
const PropTypes = require('prop-types');

// const debug = require('debug')('mongodb-compass:query-history:sidebar-component');

class SidebarComponent extends React.Component {

  /**
   * Render Sidebar component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const ListComponent = this.props.showing === 'recent' ? RecentListComponent : FavoritesListComponent;
    const ListStore = this.props.showing === 'recent' ? RecentListStore : FavoritesListStore;
    return (
      <div className="query-history-sidebar-component">
        <p>Sidebar.props.showing={this.props.showing}</p>
        <StoreConnector store={HeaderStore}>
          <HeaderComponent showing={this.props.showing}/>
        </StoreConnector>
        <StoreConnector store={ListStore}>
          <ListComponent/>
        </StoreConnector>
      </div>
    );
  }
}

SidebarComponent.propTypes = {
  showing: PropTypes.oneOf(['recent', 'favorites'])
};

SidebarComponent.defaultProps = {
  showing: 'recent'
};


SidebarComponent.displayName = 'QueryHistorySidebarComponent';

module.exports = SidebarComponent;
