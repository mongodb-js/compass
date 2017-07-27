const React = require('react');
const PropTypes = require('prop-types');

const { StoreConnector } = require('hadron-react-components');
const HeaderComponent = require('./header-component');
const RecentListComponent = require('./recent-list-component');
const FavoritesListComponent = require('./favorites-list-component');
const HeaderStore = require('../stores/header-store');
const RecentListStore = require('../stores/recent-list-store');
const FavoritesListStore = require('../stores/favorites-list-store');

class SidebarComponent extends React.Component {
  renderFavorites() {
    return (
      <StoreConnector store={FavoritesListStore}>
        <FavoritesListComponent ns={this.props.ns}/>
      </StoreConnector>
    );
  }

  renderRecents() {
    return (
      <StoreConnector store={RecentListStore}>
        <RecentListComponent ns={this.props.ns}/>
      </StoreConnector>
    );
  }

  /**
   * Render Sidebar component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    if (true) {
      return (
        <div className="query-history">
          <div className="query-history-sidebar-component">
            <StoreConnector store={HeaderStore}>
              <HeaderComponent showing={this.props.showing}/>
            </StoreConnector>
            {this.props.showing === 'favorites' ? this.renderFavorites() : null}
            {this.props.showing === 'recent' ? this.renderRecents() : null}
          </div>
        </div>
      );
    }
    return null;
  }
}

SidebarComponent.propTypes = {
  showing: PropTypes.oneOf(['recent', 'favorites']),
  collapsed: PropTypes.bool,
  ns: PropTypes.string
};

SidebarComponent.defaultProps = {
  showing: 'recent',
  collapsed: false,
  ns: ''
};


SidebarComponent.displayName = 'QueryHistorySidebarComponent';

module.exports = SidebarComponent;
