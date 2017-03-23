const React = require('react');

/**
 * A button that resets the chart.
 */
class ResetButton extends React.Component {
  render() {
    return (
      <button
          className="chart-builder-reset-button btn btn-default btn-xs"
          type="button"
          onClick={this.props.action}>
        Reset Chart
      </button>
    );
  }
}

ResetButton.propTypes = {
  action: React.PropTypes.func.isRequired
};

ResetButton.displayName = 'ResetButton';

module.exports = ResetButton;
