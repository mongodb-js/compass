const React = require('react');
const QueryActions = require('../action');
const EJSON = require('mongodb-extended-json');

// const debug = require('debug')('mongodb-compass:query-bar');

const DEFAULT_QUERY_STRING = '{}';

const QueryInputGroup = React.createClass({

  propTypes: {
    query: React.PropTypes.object.isRequired,
    lastExecutedQuery: React.PropTypes.object,
    valid: React.PropTypes.bool.isRequired,
    queryString: React.PropTypes.string.isRequired
  },

  onChange(evt) {
    QueryActions.setQueryString(evt.target.value);
  },

  onApplyButtonClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (this.props.valid) {
      QueryActions.apply();
    }
  },

  onResetButtonClicked() {
    QueryActions.reset();
  },

  /**
   * Render Query Bar input form (just the input field and buttons).
   *
   * @returns {React.Component} The Query Bar view.
   */
  render() {
    const query = this.props.queryString;
    const inputGroupClass = this.props.valid ?
      'input-group' : 'input-group has-error';
    const notEmpty = this.props.queryString !== DEFAULT_QUERY_STRING &&
      this.props.queryString !== '';
    const resetButtonStyle = {
      display: notEmpty ? 'inline-block' : 'none'
    };

    const hasChanges = this.props.queryString !== EJSON.stringify(this.props.lastExecutedQuery);
    const applyDisabled = !(this.props.valid && hasChanges);

    return (
      <form onSubmit={this.onApplyButtonClicked}>
        <div className={inputGroupClass}>
          <input
            id="refine_input"
            className="form-control input-sm"
            type="text"
            value={query}
            onChange={this.onChange}
          />
          <span className="input-group-btn">
            <button
              id="apply_button"
              className="btn btn-default btn-sm"
              type="button"
              onClick={this.onApplyButtonClicked}
              disabled={applyDisabled}>Apply</button>
            <button
              id="reset_button"
              className="btn btn-default btn-sm"
              type="button"
              onClick={this.onResetButtonClicked}
              style={resetButtonStyle}>Reset</button>
          </span>
        </div>
      </form>
    );
  }
});

module.exports = QueryInputGroup;
