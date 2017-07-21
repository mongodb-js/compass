const React = require('react');
const PropTypes = require('prop-types');
const { VALIDATION_STATES } = require('../constants');
const { ControlLabel, FormControl, FormGroup } = require('react-bootstrap');

class ArrayReductionArg extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value === undefined ? '' : this.props.value
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.value !== nextProps.value) {
      this.setState({value: nextProps.value});
    }
  }

  onChange(event) {
    const value = event.target.value;
    this.setState({value: value});
  }

  render() {
    let validationState = VALIDATION_STATES.UNMODIFIED;
    try {
      this.props.validator(this.props.value);
    } catch (e) {
      validationState = VALIDATION_STATES.ERROR;
    }

    return (
      <FormGroup
        bsClass="chart-draggable-field-row chart-draggable-field-row-reduction-arg"
        validationState={validationState}
      >
        <ControlLabel bsClass="chart-draggable-field-row-reduction-arg-label">
          {this.props.label}
        </ControlLabel>
        <FormControl
          autoFocus
          bsClass="chart-draggable-field-row-reduction-arg-value"
          onBlur={this.props.onBlur.bind(this)}
          onChange={this.onChange.bind(this)}
          placeholder={this.props.placeholder}
          type="text"
          value={this.state.value}
        />
      </FormGroup>
    );
  }
}

ArrayReductionArg.propTypes = {
  label: PropTypes.string.isRequired,
  onBlur: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  validator: PropTypes.func.isRequired,
  value: PropTypes.any
};

module.exports = ArrayReductionArg;
