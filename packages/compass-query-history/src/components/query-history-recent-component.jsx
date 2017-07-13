const React = require('react');
const PropTypes = require('prop-types');

const QueryHistoryActions = require('../actions');

// const debug = require('debug')('mongodb-compass:query-history-list-component');

class QueryHistoryRecentComponent extends React.Component {

  /**
   * Render QueryHistoryRecent component.
   *
   * Contains a Query Model (TBD).
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-recent">
        <p><i>A recent query.</i></p>
      </div>
    );
  }
}

QueryHistoryRecentComponent.propTypes = {
  model: PropTypes.object.isRequired
};

QueryHistoryRecentComponent.defaultProps = {
  model: null
};

QueryHistoryRecentComponent.displayName = 'QueryHistoryRecentComponent';

module.exports = QueryHistoryRecentComponent;
