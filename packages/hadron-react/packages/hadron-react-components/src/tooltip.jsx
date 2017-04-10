const React = require('react');
const ReactTooltip = require('react-tooltip');

class Tooltip extends React.Component {

  /**
   * Render the tooltip component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <ReactTooltip {...this.props} />
    );
  }
}

Tooltip.propTypes = {
  id: React.PropTypes.string.isRequired,
  effect: React.PropTypes.string,
  className: React.PropTypes.string,
  place: React.PropTypes.string,
  delayShow: React.PropTypes.number
};

Tooltip.defaultProps = {
  place: 'right',
  effect: 'solid',
  className: 'hadron-tooltip',
  delayShow: 200
};

Tooltip.displayName = 'Tooltip';

module.exports = Tooltip;
