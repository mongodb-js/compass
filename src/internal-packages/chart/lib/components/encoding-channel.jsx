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
    // TODO: required/optional CSS className
    // const cssOptional = this.props.optional === 'required' ? CSS : CSS;
    const cssOptional = '';
    const chartChannelId = `chart-panel-channel-${this.props.fieldName}`;
    const placeholder = 'drop a field here';
    return (
      <div>
        <label className={cssOptional} htmlFor={chartChannelId}>
          {this.props.fieldName}
        </label>
        <span id={chartChannelId}>{this.props.encodedChannel || placeholder}</span>
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
