const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const QueryComponent = require('./query-component');

class SavingComponent extends React.Component {
  constructor(props) {
    super(props);
    this.cancel = this.cancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.name = this.props.model._lastExecuted.toString();
  }

  cancel() {
    Actions.cancelSave();
  }

  handleChange(event) {
    this.name = event.target.value;
  }

  handleSubmit(event) {
    event.preventDefault();
    Actions.saveFavorite(this.props.model, this.name);
  }

  /**
   * Render SavingComponent, which represents a query being saved.
   *
   * Contains a Query Model.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    if (this.props.model !== null) {
      const attributes = this.props.model.serialize();
      return (
        <div className="query-history-favorite-query">
          <div className="query-history-favorite-query-header">
            <form onSubmit={this.handleSubmit} className="query-history-favorite-query-form">
              <input type="text" className="query-history-favorite-query-form-input" placeholder="Favorite Name" onChange={this.handleChange}/>
              <input type="submit" className="query-history-favorite-query-form-save" value="Save"/>
            </form>
            <button className="btn btn-default btn-xs query-history-favorite-query-form-cancel"
                    onClick={this.cancel}>
              CANCEL
            </button>
          </div>
          <QueryComponent attributes={attributes}
                title={this.props.model._lastExecuted.toString()}/>
        </div>
      );
    }
    return null;
  }
}

SavingComponent.propTypes = {
  model: PropTypes.object
};

SavingComponent.defaultProps = {
  model: null
};

SavingComponent.displayName = 'QueryHistorySavingComponent';

module.exports = SavingComponent;
