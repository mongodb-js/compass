/* eslint new-cap: 0 */
const React = require('react');
const PropTypes = require('prop-types');
const DropTarget = require('react-dnd').DropTarget;
const _ = require('lodash');
const DraggableField = require('./draggable-field');
const { EDIT_STATES_ENUM } = require('../constants');
const app = require('hadron-app');

// const debug = require('debug')('mongodb-compass:chart:encoding-channel');

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
  drop(props, monitor) {
    const item = monitor.getItem();
    // const encodedChannel = props.encodedChannel;
    if (item.channelName !== undefined) {
      return props.actions.swapEncodedChannels(props.channelName, item.channelName);
    }
    // Always encode the target channel
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

  componentWillMount() {
    this.Editable = app.appRegistry.getComponent('App.Editable');
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

  _applyReduction() {
    this.props.actions.applyReductions(this.props.channelName);
  }

  renderField() {
    if (_.isEmpty(this.props.encodedChannel)) {
      // render a placeholder string
      return 'drop a field here';
    }

    const fieldName = _.last(this.props.encodedChannel.field.split('.'));
    // else render a DraggableField instance with menus enabled
    return (
      <this.Editable editState={this.props.editState}>
        <DraggableField
          fieldName={fieldName}
          fieldPath={this.props.encodedChannel.field}
          channelName={this.props.channelName}
          type={this.props.encodedChannel.type}
          aggregate={this.props.encodedChannel.aggregate}
          enableMenus={this.props.specType === 'vega-lite'}
          reductions={this.props.encodedReductions}
          selectAggregate={this.onSelectAggregate.bind(this)}
          selectMeasurement={this.onSelectMeasurement.bind(this)}
          onRemove={this.onRemove.bind(this)}
          editState={this.props.editState}
          actions={this.props.actions}
        />
    </this.Editable>
    );
  }

  renderReductionEditState() {
    if (!this.props.encodedReductions) {
      return null;
    }

    switch (this.props.editState) {
      case EDIT_STATES_ENUM.INITIAL:
        // set disabled to true if none of the reduction types are set
        const disabled = this.props.encodedReductions.every((red) => {
          return !red.type;
        });
        return (
          <div>
            <button disabled={disabled}>Cancel</button>
            <button onClick={this._applyReduction.bind(this)} disabled={disabled}>Apply</button>
          </div>
        );
      case EDIT_STATES_ENUM.MODIFIED:
        return (
          <div>
            <button>Cancel</button>
            <button onClick={this._applyReduction.bind(this)}>Apply</button>
          </div>
        );
      case EDIT_STATES_ENUM.UPDATING:
        return (
          <div>
            <span>Updating...</span>
          </div>
        );
      case EDIT_STATES_ENUM.SUCCESS:
        // set edit state to unmodified after a second
        setTimeout(() => {
          this.props.actions.applyReductions(this.props.channelName, EDIT_STATES_ENUM.UNMODIFIED);
        }, 1000);

        return (
          <div>
            <span>Updated</span>
          </div>
        );
      case EDIT_STATES_ENUM.ERROR:
        return (
          <div>
            <span>An error occured</span>
          </div>
        );
      // handles UNMODIFIED case
      default: return null;
    }
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
        {this.renderReductionEditState()}
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
  editState: PropTypes.oneOf(_.values(EDIT_STATES_ENUM)),
  canDrop: PropTypes.bool.isRequired
};

EncodingChannel.defaultProps = {
};

EncodingChannel.displayName = 'EncodingChannel';

module.exports = DropTarget(DraggableField.displayName, encodingChannelTarget, collect)(EncodingChannel);
