const React = require('react');
const PropTypes = require('prop-types');
const QueryOption = require('./query-option');
const OptionsToggle = require('./options-toggle');

const _ = require('lodash');

const QUERY_PROPERTIES = require('../store/query-store').QUERY_PROPERTIES;

const OPTION_DEFINITION = {
  filter: {
    type: 'document',
    placeholder: "{ field: 'value' }",
    link: 'https://docs.mongodb.com/getting-started/shell/query/'
  },
  project: {
    type: 'document',
    placeholder: '{ field: 0 }',
    link:
      'https://docs.mongodb.com/manual/tutorial/project-fields-from-query-results/'
  },
  sort: {
    type: 'document',
    placeholder: '{ field: -1 }',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.sort/'
  },
  skip: {
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.skip/'
  },
  limit: {
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.limit/'
  },
  sample: {
    type: 'boolean',
    placeholder: null,
    link: 'https://docs.mongodb.com/TBD'
  }
};

class QueryBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasFocus: false, schemaFields: {} };
  }

  componentWillMount() {
    this.ShowQueryHistoryButton = null;
    this.ShowQueryHistoryButton = global.hadronApp.appRegistry.getComponent('QueryHistory.ShowQueryHistoryButton');
    this.QueryHistoryActions = global.hadronApp.appRegistry.getAction('QueryHistory.Actions');
  }

  componentDidMount() {
    const fieldStore = global.hadronApp.appRegistry.getStore('Field.Store');
    this.unsubscribeFieldStore = fieldStore.listen(this.onFieldsChanged.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeFieldStore();
    if (this.QueryHistoryActions) {
      this.QueryHistoryActions.collapse();
    }
  }

  onFieldsChanged(state) {
    this.setState({ schemaFields: state.fields });
  }

  onChange(label, evt) {
    const type = OPTION_DEFINITION[label].type;
    if (_.includes(['numeric', 'document'], type)) {
      return this.props.actions.typeQueryString(label, evt.target.value);
    }
    if (type === 'boolean') {
      // there is only one boolean toggle: sample
      return this.props.actions.toggleSample(evt.target.checked);
    }
  }

  onApplyButtonClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (this.props.valid || this.props.featureFlag) {
      this.props.actions.apply();
      if (_.isFunction(this.props.onApply)) {
        this.props.onApply();
      }
    }
  }

  onResetButtonClicked() {
    this.props.actions.reset();
    if (_.isFunction(this.props.onReset)) {
      this.props.onReset();
    }
  }

  _onFocus() {
    this.setState({ hasFocus: true });
  }

  _onBlur() {
    this.setState({ hasFocus: false });
  }

  _showToggle() {
    return this.props.layout.length > 1;
  }

  _queryHasChanges() {
    const query = _.pick(this.props, QUERY_PROPERTIES);
    return !_.isEqual(query, this.props.lastExecutedQuery);
  }

  /**
   * renders the options toggle button in the top right corner, if the layout
   * is multi-line.
   *
   * @returns {Component|null}  the toggle component or null.
   */
  renderToggle() {
    if (this._showToggle()) {
      return <OptionsToggle expanded={this.props.expanded} />;
    }
    return null;
  }

  /**
   * renders a single query option, either as its own row, or as part of a
   * option group.
   *
   * @param {String} option       the option name to render
   * @param {Number} id           the option number
   * @param {Boolean} hasToggle   this option contains the expand toggle
   *
   * @return {Component}          the option component
   */
  renderOption(option, id, hasToggle) {
    // for filter only, also validate feature flag directives
    const hasError = option === 'filter'
      ? !(this.props.filterValid || this.props.featureFlag)
      : !this.props[`${option}Valid`];

    // checkbox options use the value directly, text inputs use the
    // `<option>String` prop.
    const value = OPTION_DEFINITION[option].type === 'boolean' ?
      this.props[option] : this.props[`${option}String`];

    return (
      <QueryOption
        label={option}
        autoPopulated={this.props.autoPopulated}
        hasToggle={hasToggle}
        hasError={hasError}
        key={`query-option-${id}`}
        value={value}
        placeholder={OPTION_DEFINITION[option].placeholder}
        link={OPTION_DEFINITION[option].link}
        inputType={OPTION_DEFINITION[option].type}
        onChange={this.onChange.bind(this, option)}
        schemaFields={this.state.schemaFields}
      />
    );
  }

  /**
   * renders a group of several query options, that are placed horizontally
   * in the same row.
   *
   * @param {Array} group   The group array, e.g. ['sort', 'skip', 'limit']
   * @param {Number} id     The group number
   *
   * @returns {Component}   The group component
   */
  renderOptionGroup(group, id) {
    const options = _.map(group, (option, i) => {
      return this.renderOption(option, i, false);
    });
    return (
      <div className="querybar-option-group" key={`option-group-${id}`}>
        {options}
      </div>
    );
  }

  /**
   * renders the rows of the querybar component
   *
   * @return {Fragment} array of components, one for each row.
   */
  renderOptionRows() {
    // for multi-line layouts, the first option must be stand-alone
    if (this._showToggle() && !_.isString(this.props.layout[0])) {
      throw new Error(
        'First item in multi-line layout must be single option' +
          ', found' +
          this.props.layout[0]
      );
    }
    const rows = _.map(this.props.layout, (row, id) => {
      // only the first in multi-line options has the toggle
      const hasToggle = id === 0 && this._showToggle();
      if (_.isString(row)) {
        return this.renderOption(row, id, hasToggle);
      } else if (_.isArray(row)) {
        return this.renderOptionGroup(row, id);
      }
      throw new Error('Layout items must be string or array, found ' + row);
    });
    if (this.props.expanded) {
      return rows;
    }
    return rows.slice(0, 1);
  }

  /**
   * Render Query Bar input form (just the input fields and buttons).
   *
   * @returns {React.Component} The Query Bar view.
   */
  renderForm() {
    let inputGroupClass = this.props.valid
      ? 'querybar-input-group'
      : 'querybar-input-group has-error';
    if (this.props.featureFlag) {
      inputGroupClass = 'querybar-input-group input-group is-feature-flag';
    }

    const resetButtonStyle = {
      display: this.props.queryState === 'apply' ? 'inline-block' : 'none'
    };
    const applyDisabled = !(this.props.valid || this.props.featureFlag);

    const queryOptionClassName = this.state.hasFocus
      ? 'querybar-option-container querybar-has-focus'
      : 'querybar-option-container';

    return (
      <form onSubmit={this.onApplyButtonClicked.bind(this)}>
        <div className={inputGroupClass}>
          <div
            onBlur={this._onBlur.bind(this)}
            onFocus={this._onFocus.bind(this)}
            className={queryOptionClassName}
          >
            {this.renderOptionRows()}
            {this.renderToggle()}
          </div>
          <div className="querybar-button-group">
            <button
              id="apply_button"
              key="apply-button"
              className="btn btn-primary btn-sm querybar-apply-button"
              data-test-id="apply-filter-button"
              type="button"
              onClick={this.onApplyButtonClicked.bind(this)}
              disabled={applyDisabled}
            >
              {this.props.buttonLabel}
            </button>
            <button
              id="reset_button"
              key="reset-button"
              className="btn btn-default btn-sm querybar-reset-button"
              data-test-id="reset-filter-button"
              type="button"
              onClick={this.onResetButtonClicked.bind(this)}
              style={resetButtonStyle}
            >
              Reset
            </button>
            <this.ShowQueryHistoryButton />
          </div>
        </div>
      </form>
    );
  }

  render() {
    return (
      <div className="querybar-container">
        <div className="querybar-input-container">
          <div className="row">
            <div className="col-md-12">
              {this.renderForm()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

QueryBar.propTypes = {
  filter: PropTypes.object,
  project: PropTypes.object,
  sort: PropTypes.object,
  skip: PropTypes.number,
  limit: PropTypes.number,
  sample: PropTypes.bool,

  valid: PropTypes.bool,
  filterValid: PropTypes.bool,
  projectValid: PropTypes.bool,
  sortValid: PropTypes.bool,
  skipValid: PropTypes.bool,
  limitValid: PropTypes.bool,

  featureFlag: PropTypes.bool,
  autoPopulated: PropTypes.bool,
  filterString: PropTypes.string,
  projectString: PropTypes.string,
  sortString: PropTypes.string,
  skipString: PropTypes.string,
  limitString: PropTypes.string,

  actions: PropTypes.object,
  buttonLabel: PropTypes.string,
  queryState: PropTypes.string,
  layout: PropTypes.array,
  expanded: PropTypes.bool,
  lastExecutedQuery: PropTypes.object,
  onReset: PropTypes.func,
  onApply: PropTypes.func,
  schemaFields: PropTypes.object
};

QueryBar.defaultProps = {
  expanded: false,
  buttonLabel: 'Apply',
  layout: ['filter', 'project', ['sort', 'skip', 'limit']],
  schemaFields: {}
};

QueryBar.displayName = 'QueryBar';

module.exports = QueryBar;
