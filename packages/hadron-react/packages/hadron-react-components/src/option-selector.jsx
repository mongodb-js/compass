const React = require('react');
const { DropdownButton, MenuItem } = require('react-bootstrap');

/**
 * An OptionSelector component is composed of a few components:
 *
 *  1. A subset of the options available in a React-Bootstrap dropdown:
 *     @see https://react-bootstrap.github.io/components.html#btn-dropdowns-props-dropdown-button
 *  2. A label for the dropdown
 *  3. An ordered object of key-value pairs, which populate the
 *     MenuItem list when the dropdown is activated.
 */
class OptionSelector extends React.Component {

  static renderLabel(label, id) {
    return label ?
      <label className="option-selector-label" htmlFor={id}>{label}</label> :
      null;
  }

  /**
   * Renders the Option Selector component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const htmlLabel = this.constructor.renderLabel(this.props.label, this.props.id);

    const menuItems = [];
    for (let key in this.props.options) {
      if (this.props.options.hasOwnProperty(key)) {
        let label = this.props.options[key];
        menuItems.push(<MenuItem key={key} eventKey={key} href="#">{label}</MenuItem>);
      }
    }

    return (
      <div className="option-selector">
        {htmlLabel}
        <DropdownButton
          bsSize={this.props.bsSize}
          id={this.props.id}
          onSelect={this.props.onSelect}
          title={this.props.title}
          disabled={this.props.disabled}>
          {menuItems}
        </DropdownButton>
      </div>
    );
  }
}

OptionSelector.propTypes = {
  id: React.PropTypes.string.isRequired,
  bsSize: React.PropTypes.string,
  options: React.PropTypes.object.isRequired,
  label: React.PropTypes.string,
  title: React.PropTypes.string,
  onSelect: React.PropTypes.func,
  disabled: React.PropTypes.bool
};

OptionSelector.defaultProps = {
  label: '',
  title: 'Select an option',
  onSelect: () => {},
  disabled: false
};

OptionSelector.displayName = 'OptionSelector';

module.exports = OptionSelector;
