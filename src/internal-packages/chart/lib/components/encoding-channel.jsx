const React = require('react');

const Actions = require('../actions');


/**
 * Represents a Vega or Vega Lite channel for a particular chart type,
 * and whether the user has encoded a specific field into it.
 */
class EncodingChannel extends React.Component {

  static onDropField(maybeSource) {
    // TODO: Implement Drag'N'Drop and this transform, COMPASS-709 ...
    const channel = maybeSource;
    const field = maybeSource;
    Actions.mapFieldToChannel(channel, field);
    // TODO: Swap fields if source DraggableField is the ChartPanel, like http://vega.github.io/polestar/
  }

  render() {
    // TODO: Add required/optional CSS to labelClassNames
    // const cssOptional = this.props.optional === 'required' ? CSS : CSS;
    const labelClassNames = 'chart-encoding-channel-label';
    const chartChannelId = `chart-panel-channel-${this.props.fieldName}`;
    const placeholder = 'drop a field here';
    return (
      <div className="chart-encoding-channel">
        <label className={labelClassNames} htmlFor={chartChannelId}>
          {this.props.fieldName}
        </label>
        <div id={chartChannelId} className="chart-encoding-channel-droppable">
          {this.props.encodedChannel || placeholder}
        </div>
      </div>
    );
  }
}

EncodingChannel.propTypes = {
  encodedChannel: React.PropTypes.string,
  fieldName: React.PropTypes.string.isRequired,
  optional: React.PropTypes.string
};

EncodingChannel.defaultProps = {
};

EncodingChannel.displayName = 'EncodingChannel';

module.exports = EncodingChannel;
