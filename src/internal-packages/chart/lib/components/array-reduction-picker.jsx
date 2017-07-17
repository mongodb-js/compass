const React = require('react');
const PropTypes = require('prop-types');
const {Dropdown, MenuItem} = require('react-bootstrap');
const FontAwesome = require('react-fontawesome');
const _ = require('lodash');
const CustomToggle = require('./custom-toggle');
const ArrayReductionArg = require('./array-reduction-arg');
const {
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  REDUCTION_ARGS_TEMPLATE
} = require('../constants');

const GENERAL = 'general-';
const NUMERIC = 'numeric-';
const STRING = 'string-';
const DIVIDER = '-divider';
const HEADER = '-header';

class ArrayReductionPicker extends React.Component {

  setArrayReductionArg(validator, argsIndex, event) {
    const args = _.cloneDeep(this.props.args);
    const rawValue = event.target.value;
    try {
      // Allow type coercions, e.g. from string to integer
      args[argsIndex] = validator(rawValue);
    } catch (e) {
      args[argsIndex] = rawValue;
    }
    this.props.actions.setArrayReduction(this.props.channel, this.props.index, this.props.type, args);
  }

  selectArrayReduction(action, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.actions.setArrayReduction(this.props.channel, this.props.index, action, this.props.args);
  }

  renderDimensionality() {
    return Array.from(new Array(this.props.dimensionality), (v, i) => {
      return <i className="mms-icon-array" key={i} />;
    });
  }

  renderReductionArgs() {
    // Assume the args and argsTemplate lists are the same length
    const argsTemplate = REDUCTION_ARGS_TEMPLATE[this.props.type] || [];
    const paired = _.zip(argsTemplate, this.props.args.slice(0, argsTemplate.length));
    return paired.map(([argTemplate, argValue], index) => {
      const validator = argTemplate.validator;
      return (<ArrayReductionArg
        defaultValue={argValue}
        key={index}
        label={argTemplate.label}
        onBlur={this.setArrayReductionArg.bind(this, validator, index)}
        type={this.props.type}
        validator={validator}
      />);
    });
  }

  render() {
    let menu = _.values(ARRAY_GENERAL_REDUCTIONS).map((action) => {
      const key = GENERAL + action;
      return (
        <MenuItem key={key} eventKey={action} href="#">
          {action}
        </MenuItem>
      );
    });

    // add numeric accumulates
    menu.push(<MenuItem key={NUMERIC + DIVIDER} divider/>);
    menu.push(<MenuItem key={NUMERIC + HEADER} header>Numeric accumulates</MenuItem>);
    menu = menu.concat(_.values(ARRAY_NUMERIC_REDUCTIONS).map((action) => {
      const key = NUMERIC + action;
      return (
        <MenuItem key={key} eventKey={action} href="#">
          {action}
        </MenuItem>
      );
    }));

    // add string accumulates
    menu.push(<MenuItem key={STRING + DIVIDER} divider/>);
    menu.push(<MenuItem key={STRING + HEADER} header>String accumulates</MenuItem>);
    menu = menu.concat(_.values(ARRAY_STRING_REDUCTIONS).map((action) => {
      const key = STRING + action;
      return (
        <MenuItem key={key} eventKey={action} href="#">
          {action}
        </MenuItem>
      );
    }));

    let dropdownClass = 'chart-draggable-field-action chart-draggable-field-action-reduction';

    dropdownClass += this.props.type ? ' chart-draggable-field-action-default' : ' chart-draggable-field-action-primary';

    return (
      <div className="chart-draggable-field-nested">
        <div className="chart-draggable-field-row">
          <div className="chart-draggable-field-title chart-draggable-field-title-nested">
            {this.props.field}
          </div>
          {this.renderDimensionality()}
        </div>
        <div className="chart-draggable-field-row">
          <Dropdown className="chart-draggable-field-item-container chart-draggable-field-item-container-reduction" id="array-reduction-picker"
              onSelect={this.selectArrayReduction.bind(this)}>
            <CustomToggle bsRole="toggle" className={dropdownClass}>
              <span className="chart-draggable-field-action-title">
                {this.props.type || 'Choose method'}
              </span>
              <FontAwesome className="chart-draggable-field-action-icon" name={'caret-down'} />
            </CustomToggle>
            <Dropdown.Menu>
              {menu}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        {this.renderReductionArgs()}
      </div>
    );
  }
}

ArrayReductionPicker.propTypes = {
  channel: PropTypes.string,
  dimensionality: PropTypes.number.isRequired,
  field: PropTypes.string,
  type: PropTypes.string,
  args: PropTypes.arrayOf(PropTypes.string).isRequired,
  index: PropTypes.number,
  actions: PropTypes.object
};

module.exports = ArrayReductionPicker;
