const React = require('react');
const PropTypes = require('prop-types');

// const debug = require('debug')('mongodb-compass:query-history:list-component');

class FavoriteComponent extends React.Component {
  
  /**
   * Render FavoriteComponent.
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

FavoriteComponent.propTypes = {
  model: PropTypes.object.isRequired
};

FavoriteComponent.defaultProps = {
  model: null
};

FavoriteComponent.displayName = 'QueryHistoryFavoriteComponent';

module.exports = FavoriteComponent;
