const React = require('react');
const ValidationActions = require('../actions');

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
      value: this.props.field
    };
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
   * set internal state when receiving new props
   *
   * @param {Object} nextProps   props the component will receive.
   */
  willReceiveProps(nextProps) {
    this.setState({
      value: nextProps.field
    });
  }

  /**
   * The input field has lost focus (onBlur). Trigger an action to inform
   * the store of the change.
   */
  submit() {
    ValidationActions.setRuleField(this.props.id, this.state.value);
  }

  /**
   * Render RuleFieldSelector
   *
   * @returns {React.Component} The view component.
   */
  render() {
    return (
      <div className="form-group">
        <input
          type="text"
          className="form-control"
          id={this.props.id}
          value={this.state.value}
          onChange={this.onFieldChanged.bind(this)}
          onBlur={this.submit.bind(this)}
        />
      </div>
    );
  }
}

RuleFieldSelector.propTypes = {
  id: React.PropTypes.string.isRequired,
  field: React.PropTypes.string.isRequired
};

RuleFieldSelector.displayName = 'RuleFieldSelector';

module.exports = RuleFieldSelector;
