/* eslint react/no-multi-comp: 0 new-cap: 0 */
const React = require('react');
const Dropdown = require('react-bootstrap').Dropdown;
const MenuItem = require('react-bootstrap').MenuItem;
const FontAwesome = require('react-fontawesome');
const _ = require('lodash');
const DragSource = require('react-dnd').DragSource;
const { Tooltip } = require('hadron-react-components');
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
    return !props.disabled && !props.enableMenus;
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
    const tooltipId = 'array-not-supported';

    const tooltip = this.props.disabled ? (
      <Tooltip
        id={tooltipId}
      />
    ) : null;
    const tooltipText = 'Array types are not yet supported';
    const connectDragSource = this.props.connectDragSource;
    return connectDragSource(
      <div className="chart-draggable-field" title={this.props.fieldPath} data-tip={tooltipText} data-for={tooltipId}>
        {this.props.enableMenus ? this.renderMeasurementMenu() : <div></div>}
        <div className="chart-draggable-field-item-container chart-draggable-field-item-container-title">
          <div className="chart-draggable-field-item chart-draggable-field-title">
            {this.props.fieldName}
          </div>
        </div>
        {this.props.enableMenus ? this.renderAggregationMenu() : <div></div>}
        {this.props.enableMenus ?
          <div className="chart-draggable-field-item-container">
            <div className="chart-draggable-field-item chart-draggable-field-action chart-draggable-field-action-remove">
              <i className="mms-icon-remove"></i>
            </div>
          </div>
           : <div></div>}
        {tooltip}
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
  disabled: React.PropTypes.bool,
  selectAggregate: React.PropTypes.func,
  selectMeasurement: React.PropTypes.func,
  connectDragSource: React.PropTypes.func
};

DraggableField.displayName = 'DraggableField';

module.exports = DragSource(DraggableField.displayName, draggableFieldSource, collect)(DraggableField);
module.exports.displayName = DraggableField.displayName;
