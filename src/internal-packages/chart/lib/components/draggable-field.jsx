const React = require('react');
const PropTypes = require('prop-types');
const {Dropdown, MenuItem} = require('react-bootstrap');
const FontAwesome = require('react-fontawesome');
const _ = require('lodash');
const DragSource = require('react-dnd').DragSource;
const {AGGREGATE_FUNCTION_ENUM, MEASUREMENT_ENUM, MEASUREMENT_ICON_ENUM, TOOL_TIP_ARRAY_REDUCE} = require('../constants');
const CustomToggle = require('./custom-toggle');
const ArrayReductionPicker = require('./array-reduction-picker');

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
    return <FontAwesome className="chart-draggable-field-action-icon chart-draggable-field-action-icon-measurement" name={MEASUREMENT_ICON_ENUM[this.props.type]} />;
  }

  renderMeasurementMenu() {
    const menu = this.mapToMenu(_.values(MEASUREMENT_ENUM), this.props.type);

    return (
      <Dropdown title="Set field type" className="chart-draggable-field-item-container chart-draggable-field-item-container-measurement" id={this.props.fieldName + 'measurements'}
          onSelect={this.selectMeasurement.bind(this)}>
        <CustomToggle bsRole="toggle" className="chart-draggable-field-action chart-draggable-field-action-default chart-draggable-field-action-measurement">
          {this.renderMeasurementIcon()}
          <div className="chart-draggable-field-action-title">
            <span>
              {this.props.type}
            </span>
          </div>
          <FontAwesome className="chart-draggable-field-action-icon" name={'caret-down'} />
        </CustomToggle>
        {menu}
      </Dropdown>
    );
  }

  renderAggregationMenu() {
    const menu = this.mapToMenu(_.values(AGGREGATE_FUNCTION_ENUM), this.props.aggregate);

    return (
      <Dropdown title="Set aggregation type" className="chart-draggable-field-item-container chart-draggable-field-item-container-aggregation" id={this.props.fieldName + 'aggregation'}
          pullRight onSelect={this.selectAggregate.bind(this)}>
        <CustomToggle bsRole="toggle" className="chart-draggable-field-action chart-draggable-field-action-default chart-draggable-field-action-aggregation">
          <div className="chart-draggable-field-action-title">
            <span>
              {this.props.aggregate ? this.props.aggregate : 'aggregate...'}
            </span>
          </div>
          <FontAwesome className="chart-draggable-field-action-icon" name={'caret-down'} />
        </CustomToggle>
        {menu}
      </Dropdown>
    );
  }

  renderReductions() {
    const reductions = this.props.reductions.map((reduction, i) => {
      return (<ArrayReductionPicker
        key={i}
        index={i}
        channel={this.props.channelName}
        field={reduction.field}
        actions={this.props.actions}
        type={reduction.type || null}
      />);
    });

    return (
      <div>
        { reductions }
      </div>
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
      <div className="chart-draggable-field" title={this.props.fieldPath} >
        <div className="chart-draggable-field-row">
          <div className="chart-draggable-field-item-container chart-draggable-field-item-container-title">
            <div className="chart-draggable-field-title">
              {!_.isEmpty(this.props.reductions) && this.props.enableMenus ?
                <span className="chart-draggable-field-title-array">Array Reduction</span>
                : <span>{this.props.fieldName}</span>
              }
            </div>
          </div>
          {this.props.enableMenus ?
            <div title="Remove field from chart" className="chart-draggable-field-item-container chart-draggable-field-item-container-remove">
              <div className="chart-draggable-field-action chart-draggable-field-action-remove"
                  onClick={this.props.onRemove.bind(this, this.props.channelName)}>
                <i className="mms-icon-remove"></i>
              </div>
            </div> : null}
        </div>
        {!_.isEmpty(this.props.reductions) && this.props.enableMenus ?
          <div>
            { this.renderReductions() }
            <div className="chart-draggable-field-nested chart-draggable-field-nested-controls">
              <div className="chart-draggable-field-item-container chart-draggable-field-item-container-title">
                <div className="chart-draggable-field-title chart-draggable-field-title-nested">
                  <span>{this.props.fieldName}</span>
                </div>
              </div>
              <div className="chart-draggable-field-row">
                {this.props.enableMenus ? this.renderMeasurementMenu() : null}
                {this.props.enableMenus ? this.renderAggregationMenu() : null}
              </div>
            </div>
          </div>
          :
          <div className="chart-draggable-field-row">
            {this.props.enableMenus ? this.renderMeasurementMenu() : null}
            {this.props.enableMenus ? this.renderAggregationMenu() : null}
          </div>
         }
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
  reductions: PropTypes.array,
  actions: PropTypes.object,
  selectAggregate: PropTypes.func,
  selectMeasurement: PropTypes.func,
  connectDragSource: PropTypes.func,
  onRemove: PropTypes.func
};

DraggableField.displayName = 'DraggableField';

module.exports = DragSource(DraggableField.displayName, draggableFieldSource, collect)(DraggableField);  // eslint-disable-line new-cap
module.exports.displayName = DraggableField.displayName;
