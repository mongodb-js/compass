const React = require('react');
const PropTypes = require('prop-types');
const ValidationActions = require('../actions');
const { FormGroup, FormControl } = require('react-bootstrap');

/**
 * Component to select a field for which the rule applies.
 *
 * @todo this is currently a simple input field but needs to become a
 * select2 type auto-complete/dropdown component.
 *
 * @see https://jedwatson.github.io/react-select/
 */
class RuleFieldSelector extends React.Component {

  /**
   * constructor sets the initial state.
   *
   * @param {Object} props   initial props, passed to super class.
   */
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.field,
      isValid: true,
      hasStartedValidating: false
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      value: props.field
    });
  }

  /**
   * The content of the input field has changed (onChange). Update internal
   * state but do not trigger an action to change the store yet.
   *
   * @param {Object} evt   event triggered on onBlur.
   */
  onFieldChanged(evt) {
    this.setState({
      value: evt.target.value
    });
  }

  /**
   * The input field has lost focus (onBlur). Trigger an action to inform
   * the store of the change.
   */
  onBlur() {
    this.validate(true);
    ValidationActions.setRuleField(this.props.id, this.state.value);
  }

  validate(force) {
    if (!force && !this.state.hasStartedValidating) {
      return true;
    }
    const isValid = this.state.value !== '';
    this.setState({
      isValid: isValid,
      hasStartedValidating: true
    });
    return isValid;
  }

  /**
   * Render RuleFieldSelector
   *
   * @returns {React.Component} The view component.
   */
  render() {
    const validationState = this.state.isValid ? null : 'error';
    return (
      <FormGroup validationState={validationState}>
        <FormControl
          type="text"
          placeholder="Enter field name"
          id={this.props.id}
          value={this.state.value}
          onChange={this.onFieldChanged.bind(this)}
          onBlur={this.onBlur.bind(this)}
          disabled={!this.props.isWritable}
        />
      </FormGroup>
    );
  }
}

RuleFieldSelector.propTypes = {
  id: PropTypes.string.isRequired,
  field: PropTypes.string.isRequired,
  isWritable: PropTypes.bool
};

RuleFieldSelector.displayName = 'RuleFieldSelector';

module.exports = RuleFieldSelector;
