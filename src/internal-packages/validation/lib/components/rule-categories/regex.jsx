const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const ValidationAction = require('../../actions');
const bootstrap = require('react-bootstrap');
const FormGroup = bootstrap.FormGroup;
const FormControl = bootstrap.FormControl;
const DropdownButton = bootstrap.DropdownButton;
const MenuItem = bootstrap.MenuItem;

// const debug = require('debug')('mongodb-compass:validation');

const CASE_INSENSITIVE = 'case insensitivity';
const MULTILINE = 'multiline anchor match';
const EXTENDED = 'extended ignore non-escaped whitespace';
const NEWLINE = 'dot * includes newline';

class RuleCategoryRegex extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value: _.get(this.props.parameters, 'regex', ''),
      options: _.get(this.props.parameters, 'options', '')
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: _.get(nextProps.parameters, 'regex', ''),
      options: _.get(nextProps.parameters, 'options', '')
    });
  }

  onChange(evt) {
    this.setState({
      value: evt.target.value
    });
  }

  onOptionChange(evt) {
    if (evt.target.checked) {
      // Add the option to the Regex options.
      this.setState({ options: `${this.state.options}${evt.target.value}` });
    } else {
      // Remove the option from the Regex options.
      this.setState({ options: this.state.options.replace(evt.target.value, '') });
    }
  }

  onDropdownClosed() {
    this.onBlur();
  }

  onBlur() {
    ValidationAction.setRuleParameters(this.props.id, {
      regex: this.state.value,
      options: this.state.options
    });
  }

  /**
   * get the initial parameters for this rule category.
   *
   * @return {Object}   the parameters for this rule.
   */
  static getInitialParameters() {
    return {
      regex: '',
      options: ''
    };
  }

  /**
   * Convert the parameters describing the state of this rule to a query
   * value that MongoDB understands.
   *
   * @param {Object} params   the parameters describing the state of this rule
   *
   * @return {Object}   the value describing this rule.
   */
  static paramsToQuery(params) {
    if (_.has(params, 'regex')) {
      return {
        $regex: _.get(params, 'regex', ''),
        $options: _.get(params, 'options', '')
      };
    }
    return false;
  }

  /**
   * Detect if a query can be represented by this rule, and if it can,
   * convert the a query value returned from the server to an object of
   * parameters describing the state of this rule.
   *
   * @param {Object} query   The query value for this field.
   *
   * @return {Object|Boolean}  the parameters describing the state of this rule
   *                           or false if the query cannot be described by
   *                           this rule.
   */
  static queryToParams(query) {
    // $regex form
    if (_.includes(_.keys(query), '$regex')) {
      return {
        regex: query.$regex || '',
        options: query.$options || ''
      };
    }
    // javascript RegExp form
    if (_.isRegExp(query)) {
      return {
        regex: query.source,
        options: query.flags
      };
    }
    return false;
  }

  isOptionSelected(option) {
    return this.state.options.indexOf(option) > -1;
  }

  /**
   * Render ValidationHeader.
   *
   * @returns {React.Component} The view component.
   */
  render() {
    const controlId = `param-regex-${this.props.id}`;
    return (
      <FormGroup controlId={controlId}>
        <FormControl
          type="text"
          value={this.state.value}
          placeholder="Enter regular expression"
          onChange={this.onChange.bind(this)}
          onBlur={this.onBlur.bind(this)}
          disabled={!this.props.isWritable}
        />
        <DropdownButton id="regex-options"
          title="Options"
          className="regex-dropdown"
          onClose={this.onDropdownClosed.bind(this)}
        >
          <MenuItem header>
            <input
              type="checkbox"
              value="i"
              checked={this.isOptionSelected('i')}
              disabled={!this.props.isWritable}
              onChange={this.onOptionChange.bind(this)} />
            <b>i</b>
            {CASE_INSENSITIVE}
          </MenuItem>
          <MenuItem header>
            <input
              type="checkbox"
              value="m"
              checked={this.isOptionSelected('m')}
              disabled={!this.props.isWritable}
              onChange={this.onOptionChange.bind(this)} />
            <b>m</b>
            {MULTILINE}
          </MenuItem>
          <MenuItem header>
            <input
              type="checkbox"
              value="x"
              checked={this.isOptionSelected('x')}
              disabled={!this.props.isWritable}
              onChange={this.onOptionChange.bind(this)} />
            <b>x</b>
            {EXTENDED}
          </MenuItem>
          <MenuItem header>
            <input
              type="checkbox"
              value="s"
              checked={this.isOptionSelected('s')}
              disabled={!this.props.isWritable}
              onChange={this.onOptionChange.bind(this)} />
            <b>s</b>
            {NEWLINE}
          </MenuItem>
        </DropdownButton>
      </FormGroup>
    );
  }
}

RuleCategoryRegex.propTypes = {
  id: PropTypes.string.isRequired,
  parameters: PropTypes.object.isRequired,
  isWritable: PropTypes.bool.isRequired
};

RuleCategoryRegex.displayName = 'RuleCategoryRegex';

module.exports = RuleCategoryRegex;
