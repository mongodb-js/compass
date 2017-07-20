/* eslint new-cap: 0 */
const React = require('react');
const PropTypes = require('prop-types');
const DropTarget = require('react-dnd').DropTarget;
const _ = require('lodash');
const DraggableField = require('./draggable-field');

// const debug = require('debug')('mongodb-compass:chart:encoding-channel');

// use alt key for copying fields on all platforms
const MODIFIER_KEY = 'altKey';

/**
 * Drop target for react-dnd
 * @see http://react-dnd.github.io/react-dnd/docs-drop-target.html
 * @type {Object}
 */
const encodingChannelTarget = {
  canDrop() {
    // All drop targets are currently valid
    return true;
  },
  drop(props, monitor, component) {
    const item = monitor.getItem();
    // if the incoming EncodingChannel has truthy isCopyEnabled state do a copy
    if (item.channelName && component.state.isCopyEnabled) {
      return props.actions.copyEncodedChannel(item.channelName, props.channelName);
    } else if (item.channelName !== undefined) {
      return props.actions.swapEncodedChannels(props.channelName, item.channelName);
    }
    // Otherwise encode the target channel
    props.actions.mapFieldToChannel(item.fieldPath, props.channelName);
  }
};

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
}

/**
 * Represents a Vega or Vega Lite channel for a particular chart type,
 * and whether the user has encoded a specific field into it.
 */
class EncodingChannel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isCopyEnabled: false};
    this.onDragStart = this.onDragStart.bind(this);
    this.onDrag = this.onDrag.bind(this);
  }

  componentDidMount() {
    window.addEventListener('drag', this.onDrag);
    window.addEventListener('dragstart', this.onDragStart);
  }

  componentWillUnmount() {
    window.removeEventListener('drag', this.onDrag);
    window.removeEventListener('dragstart', this.onDragStart);
  }

  onDragStart(event) {
    // disable HTML5 drag&drop backend internal move/copy behavior
    event.dataTransfer.effectAllowed = 'copyMove';
  }

  onDrag(event) {
    // if MODIFIER_KEY is truthy then allow copying to encoding channel otherwise don't
    const isCopyEnabled = event[MODIFIER_KEY];
    if (this.state.isCopyEnabled !== isCopyEnabled) {
      this.setState({isCopyEnabled});
    }
    event.preventDefault();
  }

  onSelectAggregate(aggregate) {
    const channel = this.props.channelName;
    this.props.actions.selectAggregate(channel, aggregate);
  }

  onSelectMeasurement(measurement) {
    const channel = this.props.channelName;
    this.props.actions.selectMeasurement(channel, measurement);
  }

  onRemove(channelName) {
    this.props.actions.mapFieldToChannel(null, channelName);
  }

  renderField() {
    if (_.isEmpty(this.props.encodedChannel)) {
      // render a placeholder string
      return 'drop a field here';
    }

    const fieldName = _.last(this.props.encodedChannel.field.split('.'));
    // else render a DraggableField instance with menus enabled
    return (
      <DraggableField
        fieldName={fieldName}
        fieldPath={this.props.encodedChannel.field}
        channelName={this.props.channelName}
        type={this.props.encodedChannel.type}
        aggregate={this.props.encodedChannel.aggregate}
        enableMenus
        reductions={this.props.encodedReductions}
        selectAggregate={this.onSelectAggregate.bind(this)}
        selectMeasurement={this.onSelectMeasurement.bind(this)}
        onRemove={this.onRemove.bind(this)}
        actions={this.props.actions}
      />
    );
  }

  render() {
    // TODO: Add required/optional CSS to labelClassNames
    // const cssOptional = this.props.optional === 'required' ? CSS : CSS;
    const labelClassNames = 'chart-encoding-channel-label';
    const chartChannelId = `chart-panel-channel-${this.props.channelName}`;

    const connectDropTarget = this.props.connectDropTarget;
    let droppableClass = 'chart-encoding-channel-droppable';
    if (!_.isEmpty(this.props.encodedChannel)) {
      droppableClass += ' chart-encoding-channel-droppable-has-field';
    }
    if (this.props.isOver) {
      droppableClass += ' chart-encoding-channel-droppable-over';
    } else if (this.props.canDrop) {
      droppableClass += ' chart-encoding-channel-droppable-can-drop';
    }
    return connectDropTarget(
      <div className="chart-encoding-channel">
        <label className={labelClassNames} htmlFor={chartChannelId}>
          {this.props.channelName}
        </label>
        <div id={chartChannelId} className={droppableClass}>
          {this.renderField()}
        </div>
      </div>
    );
  }
}

EncodingChannel.propTypes = {
  channelName: PropTypes.string.isRequired,
  encodedChannel: PropTypes.object,
  optional: PropTypes.string,
  actions: PropTypes.object,
  connectDropTarget: PropTypes.func,
  isOver: PropTypes.bool.isRequired,
  specType: PropTypes.oneOf(['vega', 'vega-lite']),
  encodedReductions: PropTypes.array,
  canDrop: PropTypes.bool.isRequired
};

EncodingChannel.defaultProps = {
};

EncodingChannel.displayName = 'EncodingChannel';

module.exports = DropTarget(DraggableField.displayName, encodingChannelTarget, collect)(EncodingChannel);
