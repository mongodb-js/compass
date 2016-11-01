const React = require('react');
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
    // const onClick = _.get(this.props, 'onClick', () => {});
    return _.map(this.props.buttonLabels, (label) => {
      const active = this.props.activeButton === label;
      return (
        <Button
          key={label}
          active={active}
          onClick={this.props.onClick.bind(this, label)}
          disabled={this.props.disabled}
        >
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
        <ButtonGroup bsSize="xsmall">
          {buttons}
        </ButtonGroup>
      </div>
    );
  }
}

ViewSwitcher.propTypes = {
  label: React.PropTypes.string,
  buttonLabels: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  activeButton: React.PropTypes.string,
  onClick: React.PropTypes.func,
  disabled: React.PropTypes.bool
};

ViewSwitcher.defaultProps = {
  label: '',
  activeButton: '',
  onClick: () => {},
  disabled: false
};

ViewSwitcher.displayName = 'ViewSwitcher';

module.exports = ViewSwitcher;
