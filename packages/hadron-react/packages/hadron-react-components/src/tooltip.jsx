const React = require('react');
const PropTypes = require('prop-types');
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
  id: PropTypes.string.isRequired,
  effect: PropTypes.string,
  className: PropTypes.string,
  place: PropTypes.string,
  delayShow: PropTypes.number
};

Tooltip.defaultProps = {
  place: 'right',
  effect: 'solid',
  className: 'hadron-tooltip',
  delayShow: 200
};

Tooltip.displayName = 'Tooltip';

module.exports = Tooltip;
