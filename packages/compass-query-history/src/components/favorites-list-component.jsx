const React = require('react');
const PropTypes = require('prop-types');

const FavoritesComponent = require('./favorite-component');
const SavingComponent = require('./saving-component');

// const debug = require('debug')('mongodb-compass:query-history:favorites-list-component');

class FavoritesListComponent extends React.Component {
  constructor(props) {
    super(props);
    this.renderSaving = this.renderSaving.bind(this);
  }

  renderSaving() {
    if (this.props.current_favorite !== null) {
      return (
        <SavingComponent key={0} model={this.props.current_favorite}/>
      );
    }
    return null;
  }

  /**
   * Render FavoritesListComponent.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-favorites-list">
        {this.renderSaving()}
        {this.props.favorites.map(function(item, i) {
          return (
            <FavoritesComponent key={i + 1} model={item}/>
          );
        })}
      </div>
    );
  }
}

FavoritesListComponent.propTypes = {
  favorites: PropTypes.object,
  current_favorite: PropTypes.object
};

FavoritesListComponent.defaultProps = {
  favorites: null,
  current_favorite: null
};

FavoritesListComponent.displayName = 'QueryHistoryFavoritesListComponent';

module.exports = FavoritesListComponent;
