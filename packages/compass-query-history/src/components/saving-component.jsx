const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');

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
      return (
        <div className="query-history-saving">
          <form onSubmit={this.handleSubmit}>
            <label>
              Name:
              <input type="text" onChange={this.handleChange}/>
            </label>
            <input type="submit" value="Save"/>
          </form>
          <button className="query-history-cancel-button"
                  onClick={this.cancel}>
            CANCEL
          </button>
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
