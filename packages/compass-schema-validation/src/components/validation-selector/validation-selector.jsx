import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import styles from './validation-selector.module.less';

/**
 * Validation selector component.
 */
class ValidationSelector extends Component {
  static displayName = 'ValidationSelector';

  static propTypes = {
    id: PropTypes.string.isRequired,
    bsSize: PropTypes.string,
    options: PropTypes.object.isRequired,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.node]),
    title: PropTypes.string,
    onSelect: PropTypes.func,
    disabled: PropTypes.bool,
  };

  static defaultProps = {
    label: '',
    title: 'Select an option',
    onSelect: () => {},
    disabled: false,
  };

  static renderLabel(label, id) {
    return label ? (
      <label className={styles['option-selector-label']} htmlFor={id}>
        {label}
      </label>
    ) : null;
  }

  /**
   * Renders the Option Selector component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const htmlLabel = this.constructor.renderLabel(
      this.props.label,
      this.props.id
    );
    const menuItems = [];

    for (const key in this.props.options) {
      if (Object.prototype.hasOwnProperty.call(this.props.options, key)) {
        const label = this.props.options[key];

        menuItems.push(
          <MenuItem key={key} eventKey={key} href="#">
            {label}
          </MenuItem>
        );
      }
    }

    return (
      <div className={styles['option-selector']}>
        {htmlLabel}
        <DropdownButton
          bsSize={this.props.bsSize}
          id={this.props.id}
          onSelect={this.props.onSelect}
          title={this.props.title}
          disabled={this.props.disabled}
        >
          {menuItems}
        </DropdownButton>
      </div>
    );
  }
}

export default ValidationSelector;
