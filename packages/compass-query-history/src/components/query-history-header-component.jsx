const React = require('react');
const PropTypes = require('prop-types');

const QueryHistoryActions = require('../actions');
// const debug = require('debug')('mongodb-compass:query-history-header-component');

class QueryHistoryHeaderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.showRecent = this.showRecent.bind(this);
    this.showFavorites = this.showFavorites.bind(this);
  }

  showRecent() {
    if (this.props.showing !== "recent") {
      QueryHistoryActions.showRecent();
    }
  }

  showFavorites() {
    if (this.props.showing !== "favorites") {
      QueryHistoryActions.showFavorites();
    }
  }

  collapse() {
    QueryHistoryActions.collapse();
  }

  /**
   * Render QueryHistory component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-header-component">
        <p>Past Queries (Header.props.showing={this.props.showing})</p>
        <ul>
          <li id="RECENT">
            <span href="#" onClick={this.showRecent}>RECENT</span>
          </li>
          <li id="FAVORITES">
            <span href="#" onClick={this.showFavorites}>FAVORITES</span>
          </li>
          <li id="COLLAPSE">
            <span href="#" onClick={this.collapse}>X</span>
          </li>
        </ul>
      </div>
    );
  }
}

QueryHistoryHeaderComponent.propTypes = {
  showing: PropTypes.oneOf(['recent', 'favorites'])
};

QueryHistoryHeaderComponent.defaultProps = {
  showing: 'recent'
};

QueryHistoryHeaderComponent.displayName = 'QueryHistoryHeaderComponent';

module.exports = QueryHistoryHeaderComponent;
