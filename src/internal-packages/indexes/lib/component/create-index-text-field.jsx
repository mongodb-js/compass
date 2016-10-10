const React = require('react');
const Action = require('../action/index-actions');

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
    this.state = {
      value: ''
    };
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
   * Submit value by firing update option action.
   */
  submitValue() {
    Action.updateOption(this.props.option, this.state.value, this.props.isParam);
  }

  /**
   * Render the text field for parameters.
   *
   * @returns {React.Component} The create index parameter text field field.
   */
  renderParamTextField() {
    const className = this.props.units ? 'inline-option-field' : '';
    return (
      <div className="form-group create-index-param">
        <input
          type="text"
          value={this.state.value}
          className={className + ' form-control create-index-param-input'}
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
          type="text"
          className="form-control create-index-text-field-input"
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
  enabled: React.PropTypes.bool,
  isParam: React.PropTypes.bool.isRequired,
  option: React.PropTypes.string.isRequired,
  units: React.PropTypes.string
};

module.exports = CreateIndexTextField;
