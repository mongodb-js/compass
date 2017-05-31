const React = require('react');
const PropTypes = require('prop-types');
const { FormGroup } = require('react-bootstrap');
const { OptionSelector } = require('hadron-react-components');
const EncodingChannel = require('./encoding-channel');

const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:chart:chart-panel');

/**
 * Represents the chart type the user has chosen, and how the user
 * has encoded fields onto it.
 */
class ChartPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * Handles when the user changes the Chart Type from the drop down list.
   *
   * @param {String} dropdownText - The value of the OptionSelector dropdown.
   */
  onChartTypeSelect(dropdownText) {
    this.props.actions.selectChartType(dropdownText);
  }

  renderChartTypeChoice() {
    const chartTypeNames = _.indexBy(_.pluck(this.props.availableChartRoles, 'name'));
    return (
      <OptionSelector
        id="chart-type-selector"
        bsSize="xs"
        options={chartTypeNames}
        title={this.props.chartType}
        onSelect={this.onChartTypeSelect.bind(this)}
      />
    );
  }

  renderEncodingChannels() {
    const currentChartRole = _.find(this.props.availableChartRoles,
      'name', this.props.chartType);
    if (!currentChartRole) {
      // this happens on initial render before Chart.Type roles are loaded
      return null;
    }
    return currentChartRole.channels.map((channel) => {
      return (
        <EncodingChannel
          key={channel.name}
          channelName={channel.name}
          encodedChannel={this.props.encodedChannels[channel.name]}
          actions={this.props.actions}
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
  chartType: PropTypes.string.isRequired,
  availableChartRoles: PropTypes.array.isRequired,
  encodedChannels: PropTypes.object.isRequired,
  actions: PropTypes.object
};

ChartPanel.defaultProps = {
};

ChartPanel.displayName = 'ChartPanel';

module.exports = ChartPanel;
