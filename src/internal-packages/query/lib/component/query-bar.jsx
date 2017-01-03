const React = require('react');
const QueryAction = require('../action');
const shell = require('electron').shell;

// const debug = require('debug')('mongodb-compass:query-bar');

const DEFAULT_QUERY_STRING = '{}';

class QueryBar extends React.Component {

  onChange(evt) {
    QueryAction.typeQueryString(evt.target.value);
  }

  onApplyButtonClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (this.props.valid || this.props.featureFlag) {
      QueryAction.apply();
      if (this.props.onApply) {
        this.props.onApply();
      }
    }
  }

  onSyntaxHelpClicked() {
    shell.openExternal('https://docs.mongodb.com/manual/reference/mongodb-extended-json/');
  }

  onResetButtonClicked() {
    QueryAction.reset();
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

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

    const applyDisabled = !(this.props.valid || this.props.featureFlag);

    return (
      <div className="refine-view-container">
        <div className="query-input-container">
          <div className="row">
            <div className="col-md-12">
              <form onSubmit={this.onApplyButtonClicked.bind(this)}>
                <div className={inputGroupClass}>
                  <input
                    id="refine_input"
                    className="form-control input-sm input-filter"
                    type="text"
                    value={query}
                    onChange={this.onChange.bind(this)}
                    placeholder="&#123; &#34;filter&#34; : &#34;example&#34; &#125;"
                  />
                  <span className="input-group-btn">
                    <button
                      id="apply_button"
                      className="btn btn-primary btn-sm apply-filter-button"
                      data-test-id="apply-filter-button"
                      type="button"
                      onClick={this.onApplyButtonClicked.bind(this)}
                      disabled={applyDisabled}>{this.props.buttonLabel}</button>
                    <button
                      id="reset_button"
                      className="btn btn-default btn-sm reset-filter-button"
                      data-test-id="reset-filter-button"
                      type="button"
                      onClick={this.onResetButtonClicked.bind(this)}
                      style={resetButtonStyle}>Reset</button>
                  </span>
                  <i
                    className="syntax-help"
                    onClick={this.onSyntaxHelpClicked.bind(this)}
                    data-tip="Enter queries in Extended JSON (strict mode)"
                    data-effect="solid"
                    data-offset="{'top': -10}" ></i>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

QueryBar.propTypes = {
  query: React.PropTypes.object,
  lastExecutedQuery: React.PropTypes.object,
  valid: React.PropTypes.bool,
  featureFlag: React.PropTypes.bool,
  queryString: React.PropTypes.string,
  buttonLabel: React.PropTypes.string,
  onReset: React.PropTypes.func,
  onApply: React.PropTypes.func
};

QueryBar.defaultProps = {
  buttonLabel: 'Apply'
};

QueryBar.displayName = 'QueryBar';

module.exports = QueryBar;
