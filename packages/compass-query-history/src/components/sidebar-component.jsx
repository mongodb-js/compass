const React = require('react');
const PropTypes = require('prop-types');

const { StoreConnector } = require('hadron-react-components');
const HeaderComponent = require('./header-component');
const RecentListComponent = require('./recent-list-component');
const FavoritesListComponent = require('./favorites-list-component');
const HeaderStore = require('../stores/header-store');
const RecentListStore = require('../stores/recent-list-store');
const FavoritesListStore = require('../stores/favorites-list-store');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:query-history:sidebar-component');

class SidebarComponent extends React.Component {
  constructor(props) {
    super(props);
    this.renderRecents = this.renderRecents.bind(this);
    this.renderFavorites = this.renderFavorites.bind(this);
    this.addRecent = this.addRecent.bind(this);
    this.count = 0;
  }

  addRecent() {
    const newQuery = {
      filter: 'number: #' + this.count++,
      skip: 99,
      limit: 99,
      lastExecuted: Date.now()};
    Actions.addRecent(newQuery);
  }

  renderFavorites() {
    return (
      <StoreConnector store={FavoritesListStore}>
        <FavoritesListComponent/>
      </StoreConnector>
    );
  }

  renderRecents() {
    return (
      <StoreConnector store={RecentListStore}>
        <RecentListComponent/>
      </StoreConnector>
    );
  }

  /**
   * Render Sidebar component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-sidebar-component">
        <StoreConnector store={HeaderStore}>
          <HeaderComponent showing={this.props.showing}/>
        </StoreConnector>
        {this.props.showing === 'favorites' ? this.renderFavorites() : null}
        {this.props.showing === 'recent' ? this.renderRecents() : null}
        <span href="#" onClick={this.addRecent}>Click here to add a sample recent query</span>
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
