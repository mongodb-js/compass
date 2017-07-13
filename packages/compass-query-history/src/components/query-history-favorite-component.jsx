const React = require('react');
const PropTypes = require('prop-types');

const QueryHistoryActions = require('../actions');

// const debug = require('debug')('mongodb-compass:query-history-list-component');

class QueryHistoryFavoriteComponent extends React.Component {
  
  
  /**
   * Render QueryHistoryFavorite component.
   *
   * Contains a name and a Query Model (TBD).
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-favorite">
        <p><i>A query history favorite</i></p>
      </div>
    );
  }
}

QueryHistoryFavoriteComponent.propTypes = {
  model: PropTypes.object.isRequired
};

QueryHistoryFavoriteComponent.defaultProps = {
  model: null
};

QueryHistoryFavoriteComponent.displayName = 'QueryHistoryFavoriteComponent';

module.exports = QueryHistoryFavoriteComponent;
