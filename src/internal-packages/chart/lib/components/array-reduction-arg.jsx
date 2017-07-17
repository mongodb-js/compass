const React = require('react');
const PropTypes = require('prop-types');
const { VALIDATION_STATES } = require('../constants');
const { ControlLabel, FormControl, FormGroup } = require('react-bootstrap');

class ArrayReductionArg extends React.Component {

  // TODO: What actions are needed, e.g. call the validator onBlur?
  // selectArrayReduction(action, evt) {
  //   evt.preventDefault();
  //   evt.stopPropagation();
  //   this.props.actions.setArrayReduction(this.props.channel, this.props.index, action);
  // }

  render() {
    const validationState = this.props.validator(this.props.value) ?
      VALIDATION_STATES.UNMODIFIED :
      VALIDATION_STATES.ERROR;

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
          // onBlur={this.onBlur.bind(this)}
          type="text"
          value={this.props.value}
        />
      </FormGroup>
    );
  }
}

ArrayReductionArg.defaultProps = {
  value: ''
};

ArrayReductionArg.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  validator: PropTypes.func.isRequired,
  value: PropTypes.string
};

module.exports = ArrayReductionArg;
