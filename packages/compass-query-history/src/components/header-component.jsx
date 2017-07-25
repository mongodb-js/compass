const React = require('react');
const PropTypes = require('prop-types');

const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:query-history:header-component');

class HeaderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.showRecent = this.showRecent.bind(this);
    this.showFavorites = this.showFavorites.bind(this);
  }

  showRecent() {
    if (this.props.showing !== 'recent') {
      Actions.showRecent();
    }
  }

  showFavorites() {
    if (this.props.showing !== 'favorites') {
      Actions.showFavorites();
    }
  }

  collapse() {
    Actions.collapse();
  }

  /**
   * Render HeaderComponent.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-header-component">
        <div className="view-switcher">
          <span className="view-switcher-label">Past Queries</span>
          <div className="btn-group">
            <button className="btn btn-default btn-xs query-history-header-recent" href="#" onClick={this.showRecent}>RECENT</button>
            <button className="btn btn-default btn-xs query-history-header-favorites" href="#" onClick={this.showFavorites}>FAVORITES</button>
          </div>
        </div>
        <span className="query-history-header-close" href="#" onClick={this.collapse}>X</span>
      </div>
    );
  }
}

HeaderComponent.propTypes = {
  showing: PropTypes.oneOf(['recent', 'favorites'])
};

HeaderComponent.defaultProps = {
  showing: 'recent'
};

HeaderComponent.displayName = 'QueryHistoryHeaderComponent';

module.exports = HeaderComponent;
