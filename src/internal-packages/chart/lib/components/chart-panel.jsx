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

  /**
   * Handles when the user changes the Chart Type from the drop down list.
   *
   * @param {String} dropdownText - The value of the OptionSelector dropdown.
   */
  static onChartTypeSelect(dropdownText) {
    Actions.selectChartType(dropdownText.toLowerCase());
  }

  renderChartTypeChoice() {
    return (
      <this.OptionSelector
        id="chart-type-selector"
        bsSize="xs"
        options={CHART_TYPE_ENUM}
        title={this.props.chartType}
        onSelect={this.constructor.onChartTypeSelect}
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
  chartType: React.PropTypes.string.isRequired,
  encodedChannels: React.PropTypes.object.isRequired
};

ChartPanel.defaultProps = {
};

ChartPanel.displayName = 'ChartPanel';

module.exports = ChartPanel;
