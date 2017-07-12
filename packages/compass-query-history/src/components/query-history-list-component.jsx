const React = require('react');
const PropTypes = require('prop-types');

const QueryHistoryActions = require('../actions');

// const debug = require('debug')('mongodb-compass:query-history-list-component');

class QueryHistoryListComponent extends React.Component {
  constructor(props) {
    super(props);
    this.renderRecent = this.renderRecent.bind(this);
    this.renderFavorites = this.renderFavorites.bind(this);
  }

  renderFavorites() {
    return (
      <div className="query-history-list-favorites">
        <ul> {this.props.current_favorite} </ul>
        <ul>
          {this.props.favorites.map(function(item){
            return <li>{item}</li>;
          })}
        </ul>
      </div>
    );
  }

  renderRecent() {
    return (
      <div className="query-history-list-recent">
        <ul>
          {this.props.recents.map(function(item){
            return <li>{item}</li>;
          })}
        </ul>
      </div>
    );
  }

  /**
   * Render QueryHistoryList component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-list">
        <h2 className="query-history-title">QueryHistoryListComponent</h2>
        <p><i>The query history list.</i></p>
        <p>The current showing is: <code>{this.props.showing}</code></p>
        {this.props.showing === 'recent' ? this.renderRecent() : this.renderFavorites() }
      </div>
    );
  }
}

QueryHistoryListComponent.propTypes = {
  showing: PropTypes.oneOf(['recent', 'favorites'])
};

QueryHistoryListComponent.defaultProps = {
  showing: 'recent'
};

QueryHistoryListComponent.displayName = 'QueryHistoryListComponent';

module.exports = QueryHistoryListComponent;
