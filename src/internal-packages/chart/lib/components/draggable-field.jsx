const React = require('react');
const ButtonGroup = require('react-bootstrap').ButtonGroup;
const Button = require('react-bootstrap').Button;
const Dropdown = require('react-bootstrap').Dropdown;
const MenuItem = require('react-bootstrap').MenuItem;
const Radio = require('react-bootstrap').Radio;
const FontAwesome = require('react-fontawesome');
const {AGGREGATE_FUNCTION_ENUM, MEASUREMENT_ENUM, MEASUREMENT_ICON_ENUM} = require('../constants');


// const debug = require('debug')('mongodb-compass:chart:draggable-field');

class DraggableField extends React.Component {

  mapToMenu(array, type) {
    // note the empty function on onChange to avoid warnings
    const menus = array.map((label, i) => {
      return (
        <MenuItem key={i} eventKey={label}>
          <Radio checked={label === type} onChange={() => {}}>
            {label}
          </Radio>
        </MenuItem>
      );
    });

    return (
      <Dropdown.Menu>
      {menus}
      </Dropdown.Menu>
    );
  }

  selectMeasurement(measurement) {
    if (this.props.selectMeasurement) {
      this.props.selectMeasurement(measurement);
    }
  }

  selectAggregate(aggregate) {
    if (this.props.selectAggregate) {
      this.props.selectAggregate(aggregate);
    }
  }

  /**
   * @returns {React.Component} icon based on props.typeType
   */
  renderMeasurementIcon() {
    const iconClass = `fa ${MEASUREMENT_ICON_ENUM[this.props.type]}`;
    return <FontAwesome name={iconClass} />;
  }

  renderMeasurementMenu() {
    const menu = this.mapToMenu(Object.keys(MEASUREMENT_ENUM), this.props.type);

    return (
      <Dropdown id={this.props.fieldName + 'measurements'}
          onSelect={this.selectMeasurement.bind(this)}>
        <Dropdown.Toggle noCaret>
        {this.renderMeasurementIcon()}
        </Dropdown.Toggle>
          {menu}
      </Dropdown>
    );
  }

  renderAggregationMenu() {
    const menu = this.mapToMenu(Object.keys(AGGREGATE_FUNCTION_ENUM), this.props.aggregate);

    return (
      <Dropdown id={this.props.fieldName + 'aggregation'}
          onSelect={this.selectAggregate.bind(this)}>
        <Dropdown.Toggle noCaret>
          <FontAwesome name="plus" />
        </Dropdown.Toggle>
          {menu}
      </Dropdown>
    );
  }

  /**
   * Render draggable field component
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div>
        <ButtonGroup>
          {this.props.enableMenus ? this.renderMeasurementMenu()
            : <Button>{this.renderMeasurementIcon()}</Button>}
          <Button>
            {this.props.fieldName}
          </Button>
          {this.props.enableMenus ? this.renderAggregationMenu()
            : <Button><FontAwesome name="plus" /></Button>}
        </ButtonGroup>
      </div>
    );
  }
}

DraggableField.propTypes = {
  fieldName: React.PropTypes.string,
  type: React.PropTypes.oneOf(Object.keys(MEASUREMENT_ENUM)),
  aggregate: React.PropTypes.oneOf(Object.keys(AGGREGATE_FUNCTION_ENUM)),
  enableMenus: React.PropTypes.bool,
  selectAggregate: React.PropTypes.func,
  selectMeasurement: React.PropTypes.func
};

DraggableField.displayName = 'DraggableField';

module.exports = DraggableField;
