/* eslint react/no-multi-comp: 0 new-cap: 0 */
const React = require('react');
const Dropdown = require('react-bootstrap').Dropdown;
const MenuItem = require('react-bootstrap').MenuItem;
const FontAwesome = require('react-fontawesome');
const _ = require('lodash');
const DragSource = require('react-dnd').DragSource;
const {AGGREGATE_FUNCTION_ENUM, MEASUREMENT_ENUM, MEASUREMENT_ICON_ENUM} = require('../constants');

// const debug = require('debug')('mongodb-compass:chart:draggable-field');
class CustomToggle extends React.Component {
  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }
  render() {
    return (
      <div className={this.props.className} onClick={this.handleClick.bind(this)}>
        {this.props.children}
      </div>
    );
  }
}

CustomToggle.propTypes = {
  onClick: React.PropTypes.func,
  className: React.PropTypes.string,
  children: React.PropTypes.node
};

const draggableFieldSource = {
  beginDrag: function(props) {
    return {fieldPath: props.fieldPath};
  },
  canDrag: function(props) {
    return !props.enableMenus;
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

class DraggableField extends React.Component {

  mapToMenu(array, type) {
    // note the empty function on onChange to avoid warnings
    const menus = array.map((label, i) => {
      return (
        <MenuItem key={i} eventKey={label} href="#" active={label === type}>
          {label}
        </MenuItem>
      );
    });

    return (
      <Dropdown.Menu>{menus}</Dropdown.Menu>
    );
  }

  selectMeasurement(measurement, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.props.selectMeasurement) {
      this.props.selectMeasurement(measurement);
    }
  }

  selectAggregate(aggregate, evt) {
    evt.preventDefault();
    evt.stopPropagation();
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
    const menu = this.mapToMenu(_.values(MEASUREMENT_ENUM), this.props.type);

    return (
      <Dropdown id={this.props.fieldName + 'measurements'}
          onSelect={this.selectMeasurement.bind(this)}>
        <CustomToggle bsRole="toggle" className="chart-draggable-field-measurement-toggle">
          {this.renderMeasurementIcon()}
        </CustomToggle>
        {menu}
      </Dropdown>
    );
  }

  renderAggregationMenu() {
    const menu = this.mapToMenu(_.values(AGGREGATE_FUNCTION_ENUM), this.props.aggregate);

    return (
      <Dropdown id={this.props.fieldName + 'aggregation'}
          pullRight onSelect={this.selectAggregate.bind(this)}>
        <CustomToggle bsRole="toggle" className="chart-draggable-field-aggregation-toggle">
          <FontAwesome name="angle-down" />
        </CustomToggle>
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
    const connectDragSource = this.props.connectDragSource;
    return connectDragSource(
      <div className="chart-draggable-field">
        {this.props.enableMenus ? this.renderMeasurementMenu() : <div></div>}
        <div className="chart-draggable-field-title">
          {this.props.fieldName}
        </div>
        {this.props.enableMenus ? this.renderAggregationMenu() : <div></div>}
      </div>
    );
  }
}

DraggableField.propTypes = {
  fieldName: React.PropTypes.string,
  fieldPath: React.PropTypes.string,
  type: React.PropTypes.oneOf(_.values(MEASUREMENT_ENUM)),
  aggregate: React.PropTypes.oneOf(_.values(AGGREGATE_FUNCTION_ENUM)),
  enableMenus: React.PropTypes.bool,
  selectAggregate: React.PropTypes.func,
  selectMeasurement: React.PropTypes.func,
  connectDragSource: React.PropTypes.func
};

DraggableField.displayName = 'DraggableField';

module.exports = DragSource(DraggableField.displayName, draggableFieldSource, collect)(DraggableField);
module.exports.displayName = DraggableField.displayName;
