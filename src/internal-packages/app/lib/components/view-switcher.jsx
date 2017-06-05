const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const Button = require('react-bootstrap').Button;
const ButtonGroup = require('react-bootstrap').ButtonGroup;

class ViewSwitcher extends React.Component {

  /**
   * return array of button components based on buttonLabels and activeButton
   *
   * @return {React.Fragment}  array of buttons
   */
  buttonFactory() {
    return _.map(this.props.buttonLabels, (label) => {
      const active = this.props.activeButton === label;
      const dataTestId = `${this.props.dataTestId}-${label.toLowerCase().replace(/ /g, '-')}`;
      return (
        <Button key={label} active={active} data-test-id={dataTestId} disabled={this.props.disabled} onClick={this.props.onClick.bind(this, label)} bsSize="xsmall">
          {label}
        </Button>
      );
    });
  }

  /**
   * Render view switcher component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const buttons = this.buttonFactory();
    return (
      <div className="view-switcher">
        <span className="view-switcher-label">{this.props.label}</span>
        <ButtonGroup>
          {buttons}
        </ButtonGroup>
      </div>
    );
  }
}

ViewSwitcher.propTypes = {
  label: PropTypes.string,
  buttonLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeButton: PropTypes.string,
  disabled: PropTypes.bool,
  dataTestId: PropTypes.string,
  onClick: PropTypes.func
};

ViewSwitcher.displayName = 'ViewSwitcher';

module.exports = ViewSwitcher;
