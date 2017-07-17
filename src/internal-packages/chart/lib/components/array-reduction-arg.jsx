const React = require('react');
const PropTypes = require('prop-types');
const { VALIDATION_STATES } = require('../constants');
const { ControlLabel, FormControl, FormGroup } = require('react-bootstrap');

class ArrayReductionArg extends React.Component {
  render() {
    let validationState = VALIDATION_STATES.UNMODIFIED;
    try {
      this.props.validator(this.props.defaultValue);
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
          defaultValue={this.props.defaultValue}
          onBlur={this.props.onBlur.bind(this)}
          type="text"
        />
      </FormGroup>
    );
  }
}

ArrayReductionArg.defaultProps = {
  value: ''
};

ArrayReductionArg.propTypes = {
  defaultValue: PropTypes.string,
  label: PropTypes.string.isRequired,
  onBlur: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  validator: PropTypes.func.isRequired
};

module.exports = ArrayReductionArg;
