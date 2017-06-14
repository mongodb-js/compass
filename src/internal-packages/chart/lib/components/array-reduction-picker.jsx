const React = require('react');
const PropTypes = require('prop-types');
const {Dropdown, MenuItem} = require('react-bootstrap');
const FontAwesome = require('react-fontawesome');
const _ = require('lodash');
const CustomToggle = require('./custom-toggle');
const {ARRAY_GENERAL_REDUCTIONS, ARRAY_NUMERIC_REDUCTIONS, ARRAY_STRING_REDUCTIONS} = require('../constants');

const GENERAL = 'general-';
const NUMERIC = 'numeric-';
const STRING = 'string-';
const DIVIDER = '-divider';
const HEADER = '-header';

class ArrayReductionPicker extends React.Component {

  selectArrayReduction(action, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.actions.setArrayReduction(this.props.channel, this.props.index, action);
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

    let dropdownClass = 'full-width btn-md';

    dropdownClass += this.props.type ? ' btn-default' : ' btn-primary';

    return (
      <div className="btn-default">
        <div className="chart-draggable-field-title">
          <span>
            {this.props.field}
          </span>
        </div>
        <Dropdown className="chart-draggable-field-item-container" id="array-reduction-picker"
            onSelect={this.selectArrayReduction.bind(this)}>
          <CustomToggle bsRole="toggle" className={dropdownClass}>
            <span className="chart-draggable-field-action-title">
              {this.props.type || 'Choose method'}
            </span>
            <FontAwesome className="caret-down" name={'caret-down'} />
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
  index: PropTypes.number,
  actions: PropTypes.object
};

module.exports = ArrayReductionPicker;
