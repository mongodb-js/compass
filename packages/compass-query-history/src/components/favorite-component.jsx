const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');

class FavoriteComponent extends React.Component {
  constructor(props) {
    super(props);
    this.copyQuery = this.copyQuery.bind(this);
    this.deleteFavorite = this.deleteFavorite.bind(this);
  }

  copyQuery() {
    Actions.copyQuery(this.props.model);
  }

  deleteFavorite() {
    Actions.deleteFavorite(this.props.model);
  }
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
        <p><i>Name: {this.props.model.name}</i></p>
        <ul>
          <li id="COPY-FAVORITE">
            <span href="#" onClick={this.copyQuery}>Copy Favorite</span>
          </li>
          <li id="DELETE-FAVORITE">
            <span href="#" onClick={this.deleteFavorite}>Delete Favorite</span>
          </li>
        </ul>
        <p><i>Contents: {JSON.stringify(this.props.model, null, ' ')}</i></p>
      </div>
    );
  }
}

FavoriteComponent.propTypes = {
  model: PropTypes.object
};

FavoriteComponent.defaultProps = {
  model: null
};

FavoriteComponent.displayName = 'QueryHistoryFavoriteComponent';

module.exports = FavoriteComponent;
