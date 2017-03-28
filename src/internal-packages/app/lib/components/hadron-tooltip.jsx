const React = require('react');
const ReactTooltip = require('react-tooltip');

class HadronTooltip extends React.Component {

  /**
   * Render the tooltip component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <ReactTooltip {...this.props}

      />
    );
  }
}

HadronTooltip.propTypes = {
  id: React.PropTypes.string.isRequired,
  effect: React.PropTypes.string,
  className: React.PropTypes.string,
  place: React.PropTypes.string,
  delayShow: React.PropTypes.number
};

HadronTooltip.defaultProps = {
  place: 'right',
  effect: 'solid',
  className: 'hadron-tooltip',
  delayShow: 200
};

HadronTooltip.displayName = 'HadronTooltip';

module.exports = HadronTooltip;
