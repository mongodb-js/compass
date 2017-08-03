const React = require('react');
const PropTypes = require('prop-types');

class ToggleButton extends React.Component {
  /**
   * Render ToggleButton.
   *
   * @returns {React.Component} the rendered component.
   */
  render() {
    return (
        <button
          className="compass-package-toggle-button"
          type="button"
          onClick={this.props.onClick}
        >{this.props.children}</button>
    );
  }
}

ToggleButton.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node
};

ToggleButton.defaultProps = {
  children: 'Toggle'
};

ToggleButton.displayName = 'ToggleButton';

module.exports = ToggleButton;
