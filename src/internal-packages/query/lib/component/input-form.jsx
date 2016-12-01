const React = require('react');
const QueryAction = require('../action');
const EJSON = require('mongodb-extended-json');
const shell = require('electron').shell;

// const debug = require('debug')('mongodb-compass:query-bar');

const DEFAULT_QUERY_STRING = '{}';

const QueryInputGroup = React.createClass({

  propTypes: {
    query: React.PropTypes.object.isRequired,
    lastExecutedQuery: React.PropTypes.object,
    valid: React.PropTypes.bool.isRequired,
    featureFlag: React.PropTypes.bool.isRequired,
    queryString: React.PropTypes.string.isRequired
  },

  onChange(evt) {
    QueryAction.typeQueryString(evt.target.value);
  },

  onApplyButtonClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (this.props.valid || this.props.featureFlag) {
      QueryAction.apply();
    }
  },

  onSyntaxHelpClicked() {
    shell.openExternal('https://docs.mongodb.com/manual/reference/mongodb-extended-json/');
  },

  onResetButtonClicked() {
    QueryAction.reset();
  },

  /**
   * Render Query Bar input form (just the input field and buttons).
   *
   * @returns {React.Component} The Query Bar view.
   */
  render() {
    const query = this.props.queryString;
    let inputGroupClass = this.props.valid ?
      'input-group' : 'input-group has-error';
    if (this.props.featureFlag) {
      inputGroupClass = 'input-group is-feature-flag';
    }
    const notEmpty = this.props.queryString !== DEFAULT_QUERY_STRING &&
      this.props.queryString !== '';
    const resetButtonStyle = {
      display: notEmpty ? 'inline-block' : 'none'
    };

    const hasChanges = this.props.queryString !== EJSON.stringify(this.props.lastExecutedQuery);
    const applyDisabled = !((this.props.valid && hasChanges) || this.props.featureFlag);

    return (
      <form onSubmit={this.onApplyButtonClicked}>
        <div className={inputGroupClass}>
          <input
            id="refine_input"
            className="form-control input-sm input-filter"
            type="text"
            value={query}
            onChange={this.onChange}
            placeholder="&#123; &#34;filter&#34; : &#34;example&#34; &#125;"
          />
          <span className="input-group-btn">
            <button
              id="apply_button"
              className="btn btn-primary btn-sm apply-filter-button"
              type="button"
              onClick={this.onApplyButtonClicked}
              disabled={applyDisabled}>Apply</button>
            <button
              id="reset_button"
              className="btn btn-default btn-sm reset-filter-button"
              type="button"
              onClick={this.onResetButtonClicked}
              style={resetButtonStyle}>Reset</button>
          </span>
          <i
            className="syntax-help"
            onClick={this.onSyntaxHelpClicked}
            data-tip="Enter queries in Extended JSON (strict mode)"
            data-effect="solid"
            data-offset="{'top': -10}" ></i>
        </div>
      </form>
    );
  }
});

module.exports = QueryInputGroup;
