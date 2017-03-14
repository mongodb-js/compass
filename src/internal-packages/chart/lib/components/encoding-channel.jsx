const React = require('react');

const _ = require('lodash');
const Actions = require('../actions');
const DraggableField = require('./draggable-field');

// const debug = require('debug')('mongodb-compass:chart:encoding-channel');

/**
 * Represents a Vega or Vega Lite channel for a particular chart type,
 * and whether the user has encoded a specific field into it.
 */
class EncodingChannel extends React.Component {

  static onDropField(maybeSource) {
    // TODO: Implement Drag'N'Drop and this transform, COMPASS-709 ...
    const channel = maybeSource;
    const field = maybeSource;
    Actions.mapFieldToChannel(field, channel);
    // TODO: Swap fields if source DraggableField is the ChartPanel, like http://vega.github.io/polestar/
  }

  onSelectAggregate() {
  }

  onSelectMeasurement() {
  }

  renderField() {
    if (_.isEmpty(this.props.encodedChannel)) {
      // render a placeholder string
      return 'drop a field here';
    }
    // else render a DraggableField instance with menus enabled
    return (
      <DraggableField
        fieldName={this.props.encodedChannel.field}
        type={this.props.encodedChannel.type}
        aggregate={this.props.encodedChannel.aggregate}
        enableMenus
        selectAggregate={this.onSelectAggregate.bind(this)}
        selectMeasurement={this.onSelectMeasurement.bind(this)}
      />
    );
  }

  render() {
    // TODO: Add required/optional CSS to labelClassNames
    // const cssOptional = this.props.optional === 'required' ? CSS : CSS;
    const labelClassNames = 'chart-encoding-channel-label';
    const chartChannelId = `chart-panel-channel-${this.props.channelName}`;
    return (
      <div className="chart-encoding-channel">
        <label className={labelClassNames} htmlFor={chartChannelId}>
          {this.props.channelName}
        </label>
        <div id={chartChannelId} className="chart-encoding-channel-droppable">
          {this.renderField()}
        </div>
      </div>
    );
  }
}

EncodingChannel.propTypes = {
  channelName: React.PropTypes.string.isRequired,
  encodedChannel: React.PropTypes.object,
  optional: React.PropTypes.string
};

EncodingChannel.defaultProps = {
};

EncodingChannel.displayName = 'EncodingChannel';

module.exports = EncodingChannel;
