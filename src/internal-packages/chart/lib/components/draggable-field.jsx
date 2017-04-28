const React = require('react');
const PropTypes = require('prop-types');
const Dropdown = require('react-bootstrap').Dropdown;
const MenuItem = require('react-bootstrap').MenuItem;
const FontAwesome = require('react-fontawesome');
const _ = require('lodash');
const DragSource = require('react-dnd').DragSource;
const {AGGREGATE_FUNCTION_ENUM, MEASUREMENT_ENUM, MEASUREMENT_ICON_ENUM, TOOL_TIP_ID_ARRAY} = require('../constants');
const CustomToggle = require('./custom-toggle');

// const debug = require('debug')('mongodb-compass:chart:draggable-field');

const draggableFieldSource = {
  beginDrag: function(props) {
    return {
      channelName: props.channelName,
      fieldPath: props.fieldPath
    };
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
    return <FontAwesome name={MEASUREMENT_ICON_ENUM[this.props.type]} />;
  }

  renderMeasurementMenu() {
    const menu = this.mapToMenu(_.values(MEASUREMENT_ENUM), this.props.type);

    return (
      <Dropdown className="chart-draggable-field-item-container" id={this.props.fieldName + 'measurements'}
          onSelect={this.selectMeasurement.bind(this)}>
        <CustomToggle bsRole="toggle" className="chart-draggable-field-item chart-draggable-field-action chart-draggable-field-action-measurement">
          {this.renderMeasurementIcon()}
        </CustomToggle>
        {menu}
      </Dropdown>
    );
  }

  renderAggregationMenu() {
    const menu = this.mapToMenu(_.values(AGGREGATE_FUNCTION_ENUM), this.props.aggregate);

    return (
      <Dropdown className="chart-draggable-field-item-container" id={this.props.fieldName + 'aggregation'}
          pullRight onSelect={this.selectAggregate.bind(this)}>
        <CustomToggle bsRole="toggle" className="chart-draggable-field-item chart-draggable-field-action chart-draggable-field-action-aggregation">
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
    const attributes = {
      className: 'chart-draggable-field',
      title: this.props.fieldPath
    };

    // add tool tip if disabled due to array type
    if (this.props.disabled) {
      attributes['data-tip'] = 'Array types are not yet supported';
      attributes['data-for'] = TOOL_TIP_ID_ARRAY;
    }

    const connectDragSource = this.props.connectDragSource;
    return connectDragSource(
      <div {...attributes} >
        {this.props.enableMenus ? this.renderMeasurementMenu() : <div></div>}
        <div className="chart-draggable-field-item-container chart-draggable-field-item-container-title">
          <div className="chart-draggable-field-item chart-draggable-field-title">
            {this.props.fieldName}
          </div>
        </div>
        {this.props.enableMenus ? this.renderAggregationMenu() : <div></div>}
        {this.props.enableMenus ?
          <div className="chart-draggable-field-item-container">
            <div
              className="chart-draggable-field-item chart-draggable-field-action chart-draggable-field-action-remove"
              onClick={this.props.onRemove.bind(this, this.props.channelName)}
            >
              <i className="mms-icon-remove"></i>
            </div>
          </div>
           : <div></div>}
      </div>
    );
  }
}

DraggableField.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldPath: PropTypes.string.isRequired,
  channelName: PropTypes.string,
  type: PropTypes.oneOf(_.values(MEASUREMENT_ENUM)),
  aggregate: PropTypes.oneOf(_.values(AGGREGATE_FUNCTION_ENUM)),
  enableMenus: PropTypes.bool,
  disabled: PropTypes.bool,
  selectAggregate: PropTypes.func,
  selectMeasurement: PropTypes.func,
  connectDragSource: PropTypes.func,
  onRemove: PropTypes.func
};

DraggableField.displayName = 'DraggableField';

module.exports = DragSource(DraggableField.displayName, draggableFieldSource, collect)(DraggableField);  // eslint-disable-line new-cap
module.exports.displayName = DraggableField.displayName;
