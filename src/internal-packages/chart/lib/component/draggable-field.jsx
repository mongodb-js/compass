const React = require('react');
const ButtonGroup = require('react-bootstrap').ButtonGroup;
const Button = require('react-bootstrap').Button;
const Dropdown = require('react-bootstrap').Dropdown;
const MenuItem = require('react-bootstrap').MenuItem;
const Radio = require('react-bootstrap').Radio;
const {AGGREGATE_FUNCTION_ENUM, MEASUREMENT_ENUM, MEASUREMENT_ICON_ENUM} = require('../constants');

const debug = require('debug')('mongodb-compass:chart:draggable-field');

class DraggableField extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      measurement: props.measurement,
      aggregate: props.aggregate
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      measurement: props.measurement,
      aggregate: props.aggregate
    });
  }

  mapToMenu(array, type) {
    // note the empty funciton on onChange to avoid warnings
    const menus = array.map((label, i) => {
      debug('label is: ', label);
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
    debug('select for measurement is: ', measurement);
    this.setState({measurement: measurement});
  }

  selectAggregate(aggregate) {
    debug('select for aggregate is: ', aggregate);
    this.setState({aggregate: aggregate});
  }

  /**
   * @returns {React.Component} icon based on props.measurementType
   */
  renderMeasurementIcon() {
    const iconClass = `fa ${MEASUREMENT_ICON_ENUM[this.state.measurement]}`;
    return <i className={iconClass} />;
  }

  renderMeasurementMenu() {
    const menu = this.mapToMenu(Object.keys(MEASUREMENT_ENUM), this.state.measurement);

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
    const menu = this.mapToMenu(Object.keys(AGGREGATE_FUNCTION_ENUM), this.state.aggregate);

    return (
      <Dropdown id={this.props.fieldName + 'aggregation'}
          onSelect={this.selectAggregate.bind(this)}>
        <Dropdown.Toggle noCaret>
          <i className="fa fa-plus" />
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
            : <Button><i className="fa fa-plus" /></Button>}
        </ButtonGroup>
      </div>
    );
  }
}

DraggableField.propTypes = {
  fieldName: React.PropTypes.string,
  measurement: React.PropTypes.oneOf(Object.keys(MEASUREMENT_ENUM)),
  aggregate: React.PropTypes.oneOf(Object.keys(AGGREGATE_FUNCTION_ENUM)),
  enableMenus: React.PropTypes.bool
};

DraggableField.displayName = 'DraggableField';

module.exports = DraggableField;
