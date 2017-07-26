const React = require('react');
const FontAwesome = require('react-fontawesome');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const QueryComponent = require('./query-component');


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
   * Contains a Query Model.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const attributes = this.props.model.serialize();
    return (
      <div className="query-history-favorite-query">
        <div className="btn-group">
          <button className="btn btn-sm btn-default query-history-button" onClick={this.copyQuery}>
            <FontAwesome name="clipboard"/>
          </button>
          <button className="btn btn-sm btn-default query-history-button" onClick={this.deleteFavorite}>
            <FontAwesome name="trash"/>
          </button>
        </div>
        <QueryComponent attributes={attributes} title={this.props.model._name}/>
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
