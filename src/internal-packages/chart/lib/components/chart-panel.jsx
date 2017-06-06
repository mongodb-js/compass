const React = require('react');
const PropTypes = require('prop-types');
const { FormGroup, Dropdown, MenuItem } = require('react-bootstrap');
const FontAwesome = require('react-fontawesome');
const EncodingChannel = require('./encoding-channel');
const CustomToggle = require('./custom-toggle');

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
    const chartTypes = this.props.availableChartRoles.map((role) => {
      const icon = <i className={role.icon || 'chart-type-picker-no-icon'} />;
      return (<MenuItem key={role.name} eventKey={role.name}>{icon} {role.name}</MenuItem>);
    });
    const selectedChartIcon = _.result(
      _.find(this.props.availableChartRoles, {name: this.props.chartType}),
      'icon', 'chart-type-picker-no-icon');

    return (
        <Dropdown id="chart-type-selector" className="chart-type-picker-dropdown btn btn-default btn-lg" onSelect={this.onChartTypeSelect.bind(this)}>
          <CustomToggle bsRole="toggle" className="chart-type-picker-toggle">
            <div className="chart-type-picker-title">
              <i className={selectedChartIcon} />
              <span className="chart-type-picker-title-name">{this.props.chartType}</span>
              <FontAwesome className="chart-type-picker-caret-down" name={'caret-down'} />
            </div>
          </CustomToggle>
          <Dropdown.Menu>
            {chartTypes}
          </Dropdown.Menu>
        </Dropdown>
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
          specType={this.props.specType}
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
        <label className="chart-encoding-channel-label">Chart Type</label>
        {chartType}
        {encodingChannels}
      </FormGroup>
    );
  }
}

ChartPanel.propTypes = {
  specType: PropTypes.oneOf(['vega', 'vega-lite']).isRequired,
  chartType: PropTypes.string.isRequired,
  availableChartRoles: PropTypes.array.isRequired,
  encodedChannels: PropTypes.object.isRequired,
  actions: PropTypes.object
};

ChartPanel.defaultProps = {
};

ChartPanel.displayName = 'ChartPanel';

module.exports = ChartPanel;
