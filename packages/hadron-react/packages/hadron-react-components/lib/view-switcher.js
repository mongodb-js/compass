const React = require('react');
const PropTypes = require('prop-types');
const { Button, ButtonGroup } = require('react-bootstrap');

/**
 * Represents a component that provides buttons to switch between
 * view modes.
 */
class ViewSwitcher extends React.Component {

  /**
   * return array of button components based on buttonLabels and activeButton
   *
   * @return {React.Fragment}  array of buttons
   */
  buttonFactory() {
    return this.props.buttonLabels.map((label, i) => {
      const active = this.props.activeButton === label;
      const dataTestId = `${this.props.dataTestId}-${label.toLowerCase().replace(/ /g, '-')}`;
      return React.createElement(
        Button,
        {
          key: label,
          active: active,
          'data-test-id': dataTestId,
          disabled: this.props.disabled,
          onClick: this.props.onClick.bind(this, label),
          bsSize: 'xsmall' },
        this.renderIcon(i),
        label
      );
    });
  }

  renderIcon(i) {
    console.log(this.props.iconClassNames);
    if (this.props.iconClassNames[i]) {
      return React.createElement('i', { className: this.props.iconClassNames[i], 'aria-hidden': true });
    }
  }

  /**
   * Render view switcher component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const buttons = this.buttonFactory();
    return React.createElement(
      'div',
      { className: 'view-switcher' },
      React.createElement(
        'span',
        { className: 'view-switcher-label' },
        this.props.label
      ),
      React.createElement(
        ButtonGroup,
        null,
        buttons
      )
    );
  }
}

ViewSwitcher.propTypes = {
  label: PropTypes.string,
  buttonLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeButton: PropTypes.string,
  disabled: PropTypes.bool,
  dataTestId: PropTypes.string,
  onClick: PropTypes.func,
  iconClassNames: PropTypes.arrayOf(PropTypes.string)
};

ViewSwitcher.defaultProps = {
  iconClassNames: []
};

ViewSwitcher.displayName = 'ViewSwitcher';

module.exports = ViewSwitcher;