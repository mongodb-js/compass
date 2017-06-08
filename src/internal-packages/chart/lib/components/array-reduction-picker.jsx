const React = require('react');
const PropTypes = require('prop-types');
const {Dropdown, MenuItem} = require('react-bootstrap');
const FontAwesome = require('react-fontawesome');
const _ = require('lodash');
const CustomToggle = require('./custom-toggle');
const {ARRAY_GENERAL_REDUCTION_ACTIONS, ARRAY_NUMERIC_REDUCTION_ACTIONS, ARRAY_STRING_REDUCTION_ACTIONS} = require('../constants');

const GENERAL = 'general-';
const NUMERIC = 'numeric-';
const STRING = 'string-';
const DIVIDER = '-divider';
const HEADER = '-header';

class ArrayReductionPicker extends React.Component {

  selectArrayReduction(action, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.actions.setArrayReduction(this.props.channel, this.props.field, action);
  }

  render() {
    let prefix = GENERAL;
    let menu = _.values(ARRAY_GENERAL_REDUCTION_ACTIONS).map((action) => {
      const key = prefix + action;
      return (
        <MenuItem key={action} eventKey={key} href="#">
          {action}
        </MenuItem>
      );
    });

    // add numeric accumalates
    prefix = NUMERIC;
    menu.push(<MenuItem key={NUMERIC + DIVIDER} divider/>);
    menu.push(<MenuItem key={NUMERIC + HEADER} header>Numeric accumalates</MenuItem>);
    menu = menu.concat(_.values(ARRAY_NUMERIC_REDUCTION_ACTIONS).map((action) => {
      const key = prefix + action;
      return (
        <MenuItem key={action} eventKey={key} href="#">
          {action}
        </MenuItem>
      );
    }));

    // add string accumalates
    menu.push(<MenuItem key={STRING + DIVIDER} divider/>);
    menu.push(<MenuItem key={STRING + HEADER} header>String accumalates</MenuItem>);
    menu = menu.concat(_.values(ARRAY_STRING_REDUCTION_ACTIONS).map((action) => {
      const key = prefix + action;
      return (
        <MenuItem key={action} eventKey={key} href="#">
          {action}
        </MenuItem>
      );
    }));

    let dropdownClass = 'chart-draggable-field-array-picker-dropdown';

    if (!this.props.type) {
      dropdownClass += ' chart-draggable-field-array-picker-unselected';
    }

    return (
      <div className="chart-draggable-field-array-picker">
        <div className="chart-draggable-field-title">
          <span>
            {this.props.field}
          </span>
        </div>
        <Dropdown className="chart-draggable-field-array-picker" id="array-reduction-picker"
            onSelect={this.selectArrayReduction.bind(this)}>
          <CustomToggle bsRole="toggle" className={dropdownClass}>
            <span className="chart-draggable-field-array-picker-title-name chart-draggable-field-action-title">
              {this.props.type || 'Choose method'}
            </span>
            <FontAwesome className="chart-draggable-field-array-picker-caret-down" name={'caret-down'} />
          </CustomToggle>
          <Dropdown.Menu>
            {menu}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}

ArrayReductionPicker.propTypes = {
  channel: PropTypes.string,
  field: PropTypes.string,
  type: PropTypes.string,
  actions: PropTypes.object
};

module.exports = ArrayReductionPicker;
