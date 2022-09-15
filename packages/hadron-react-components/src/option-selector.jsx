import React from 'react';
import PropTypes from 'prop-types';
import { DropdownButton, MenuItem } from 'react-bootstrap';

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
    for (const [key, label] of Object.entries(this.props.options)) {
      menuItems.push(<MenuItem data-testid={`${this.props.id}-${key}`} key={key} eventKey={key} href="#">{label}</MenuItem>);
    }

    return (
      <div className="option-selector">
        {htmlLabel}
        <DropdownButton
          bsSize={this.props.bsSize}
          className={this.props.className}
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
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  bsSize: PropTypes.string,
  options: PropTypes.object.isRequired,
  label: PropTypes.string,
  // for titles with glyphicons, this has to accept string or object
  title: PropTypes.oneOfType([ PropTypes.string, PropTypes.object ]),
  onSelect: PropTypes.func,
  disabled: PropTypes.bool
};

OptionSelector.defaultProps = {
  label: '',
  title: 'Select an option',
  onSelect: () => {},
  disabled: false
};

OptionSelector.displayName = 'OptionSelector';

export default OptionSelector;
