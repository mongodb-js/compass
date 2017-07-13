const React = require('react');
const PropTypes = require('prop-types');

const QueryHistoryRecentComponent = require('./query-history-recent-component');

// const debug = require('debug')('mongodb-compass:query-history-recent-list-component');

class QueryHistoryRecentListComponent extends React.Component {

  /**
   * Render QueryHistoryRecentList component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-recent-list">
        <h2 className="query-history-title">QueryHistoryRecentListComponent</h2>
        <p><i>The query history recent-list.</i></p>
        <ul>
          {this.props.recents.map(function(item){
            return (
              <QueryHistoryRecentComponent model={item}/>
            );
          })}
        </ul>
      </div>
    );
  }
}

QueryHistoryRecentListComponent.propTypes = {
  recents: PropTypes.array
};

QueryHistoryRecentListComponent.defaultProps = {
  recents: []
};

QueryHistoryRecentListComponent.displayName = 'QueryHistoryRecentListComponent';

module.exports = QueryHistoryRecentListComponent;
