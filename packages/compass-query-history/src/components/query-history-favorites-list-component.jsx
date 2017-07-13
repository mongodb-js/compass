const React = require('react');
const PropTypes = require('prop-types');

const QueryHistoryFavoritesComponent = require('./query-history-favorite-component');

// const debug = require('debug')('mongodb-compass:query-history-favorites-list-component');

class QueryHistoryFavoritesListComponent extends React.Component {
  
  /**
   * Render QueryHistoryFavoritesList component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-favorites-list">
        <h2 className="query-history-title">QueryHistoryFavoritesListComponent</h2>
        <p><i>The query history favorites-list.</i></p>
        <ul>
          {this.props.favorites.map(function(item){
            return (
              <QueryHistoryFavoritesComponent model={item}/>
            );
          })}
        </ul>
      </div>
    );
  }
}

QueryHistoryFavoritesListComponent.propTypes = {
  favorites: PropTypes.array
};

QueryHistoryFavoritesListComponent.defaultProps = {
  favorites: []
};

QueryHistoryFavoritesListComponent.displayName = 'QueryHistoryFavoritesListComponent';

module.exports = QueryHistoryFavoritesListComponent;
