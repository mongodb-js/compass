import React from 'react';
import PropTypes from 'prop-types';
import { accepts } from 'mongodb-language-model';
import EJSON from 'mongodb-extended-json';
import trim from 'lodash.trim';
import Actions from 'actions';

/**
 * Component for the create index text field.
 */
class CreateIndexTextField extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const state = {
      value: props.value
    };
    this.state = state;
  }

  /**
   * Update stored state value when input field changes.
   *
   * @param {Object} evt - The input change event.
   */
  handleChange(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    let value = evt.target.value;
    if (this.props.option === 'name') {
      // max index name length of 128 characters
      value = value.substring(0, 128);
    }
    this.setState({ value: value });
  }

  /**
   * Format query string for partial filter expression (taken from query module).
   *
   * @param {string} queryString - The partial filter object string to be cleaned.
   * @returns {string} The formatted query string.
   */
  _cleanQueryString(queryString) {
    let output = queryString;
    // accept whitespace-only input as empty query
    if (trim(output) === '') {
      output = '{}';
    }
    // wrap field names in double quotes. I appologize for the next line of code.
    // @see http://stackoverflow.com/questions/6462578/alternative-to-regex-match-all-instances-not-inside-quotes
    // @see https://regex101.com/r/xM7iH6/1
    output = output.replace(/([{,])\s*([^,{\s\'"]+)\s*:(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/g, '$1"$2":');
    // replace multiple whitespace with single whitespace
    output = output.replace(/\s+/g, ' ');
    return output;
  }

  /**
   * validates whether a string is a valid query (from query module).
   *
   * @param  {Object} queryString    a string to validate
   * @returns {Object|Boolean}        false if invalid, otherwise the query
   */
  _validateQueryString(queryString) {
    try {
      const cleaned = this._cleanQueryString(queryString);
      // is it valid eJSON?
      const parsed = EJSON.parse(cleaned);
      // can it be serialized to JSON?
      const stringified = JSON.stringify(parsed);
      // is it a valid MongoDB query according to the language?
      return accepts(stringified);
    } catch (e) {
      return false;
    }
  }

  /**
   * Submit value by firing update option action.
   */
  submitValue() {
    let value = this.state.value;
    if (this.props.option === 'partialFilterExpression') {
      value = this._cleanQueryString(value);
    }
    Actions.updateOption(this.props.option, value, this.props.isParam);
  }

  /**
   * Render the text field for parameters.
   *
   * @returns {React.Component} The create index parameter text field field.
   */
  renderParamTextField() {
    let groupClassName = 'form-group create-index-param';
    let inputClassName = 'form-control create-index-param-input';
    if (this.props.units) inputClassName += ' inline-option-field';
    if (this.props.option === 'partialFilterExpression') {
      inputClassName += ' partial-filter-input';
      const valid = this._validateQueryString(this.state.value);
      if (!valid) groupClassName += ' has-error';
    }
    return (
      <div className={groupClassName}>
        <input
          type="text"
          value={this.state.value}
          data-test-id={this.props.dataTestId}
          className={inputClassName}
          disabled={!this.props.enabled}
          onBlur={this.submitValue.bind(this)}
          onChange={this.handleChange.bind(this)} />
        {this.props.units ?
          <p className="create-index-param-description">{this.props.units}</p>
          : null}
      </div>
    );
  }

  /**
   * Render the regular text field.
   *
   * @returns {React.Component} The regular create index text field field.
   */
  renderTextField() {
    return (
      <div className="form-group create-index-text-field" >
        <input
          autoFocus={this.props.autoFocus}
          type="text"
          className="form-control create-index-text-field-input"
          data-test-id={this.props.dataTestId}
          value={this.state.value}
          onBlur={this.submitValue.bind(this)}
          onChange={this.handleChange.bind(this)} />
      </div>
    );
  }

  /**
   * Render the create index text field.
   *
   * @returns {React.Component} The create index text field.
   */
  render() {
    if (this.props.isParam) {
      return this.renderParamTextField();
    }
    return this.renderTextField();
  }
}

CreateIndexTextField.displayName = 'CreateIndexTextField';

CreateIndexTextField.propTypes = {
  autoFocus: PropTypes.bool,
  enabled: PropTypes.bool,
  isParam: PropTypes.bool.isRequired,
  option: PropTypes.string.isRequired,
  units: PropTypes.string,
  dataTestId: PropTypes.string,
  value: PropTypes.string.isRequired
};

CreateIndexTextField.defaultProps = {
  autoFocus: false
};

export default CreateIndexTextField;
