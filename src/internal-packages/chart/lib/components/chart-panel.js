const app = require('hadron-app');
const React = require('react');
const { FormGroup } = require('react-bootstrap');

const Actions = require('../actions');
const {
  CHART_TYPE_CHANNELS,
  CHART_TYPE_ENUM
} = require('../constants');
const EncodingChannel = require('./encoding-channel');


/**
 * Represents the chart type the user has chosen, and how the user
 * has encoded fields onto it.
 */
class ChartPanel extends React.Component {
  constructor(props) {
    super(props);
    this.OptionSelector = app.appRegistry.getComponent('App.OptionSelector');
  }

  static onChartTypeSelect(event) {
    // TODO: Test this action once we have COMPASS-887,
    // TODO: ... it's probably `event.target.value` or similar
    Actions.selectChartType(event);
  }

  renderChartTypeChoice() {
    return (
      <this.OptionSelector
        id="chart-type-selector"
        bsSize="xs"
        options={CHART_TYPE_ENUM}
        title={this.props.chartType}
        onSelect={this.constructor.onChartTypeSelect}
        disabled={!this.props.isWritable}
      />
    );
  }

  renderEncodingChannels() {
    const availableChannels = CHART_TYPE_CHANNELS[this.props.chartType];
    return Object.keys(availableChannels).map((channel) => {
      return (
        <EncodingChannel
          key={channel}
          fieldName={channel}
          encodedChannel={this.props.encodedChannels[channel]}
        />
      );
    });
  }

  render() {
    const chartType = this.renderChartTypeChoice();
    const encodingChannels = this.renderEncodingChannels();
    return (
      <FormGroup>
        {chartType}
        {encodingChannels}
      </FormGroup>
    );
  }
}

ChartPanel.propTypes = {
  // TODO: COMPASS-700 Spec has title but invision wireframe does not. Do we need it?
  // https://mongodb.invisionapp.com/share/6S9X3XDQ5#/screens/215032493_200
  // title: React.PropTypes.string,

  chartType: React.PropTypes.string.isRequired,
  encodedChannels: React.PropTypes.object,

  // Not yet sure whether we want to disable charts, e.g. on a secondary,
  // if we can't save and share them?
  isWritable: React.PropTypes.bool
};

ChartPanel.defaultProps = {
  isWritable: true
};

ChartPanel.displayName = 'ChartPanel';

module.exports = ChartPanel;
