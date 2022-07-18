import React from 'react';
import PropTypes from 'prop-types';
import TypeChecker from 'hadron-type-checker';

/**
 * The version at which high precision values are available.
 */
const HP_VERSION = '3.4.0';

/**
 * General types component.
 */
class Types extends React.Component {
  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
    this.element = props.element;
    this.className = props.className ? props.className : 'editable-element';
  }

  /**
   * Get the class name for the dropdown.
   *
   * @returns {String} The class name.
   */
  getClassName() {
    let className = `${this.className}-types dropdown`;
    if (this.element.currentType !== this.element.type) {
      className = `${className} editable-element-types-is-edited`;
    }
    return this.state.isOpen ? `${className} open` : `${className} closed`;
  }

  /**
   * Get the castable value for this value.
   *
   * @returns {Object} The cast value.
   */
  castableValue() {
    return this.element.generateObject();
  }

  /**
   * Handles a change in the type.
   *
   * @param {Event} evt - The event.
   */
  handleTypeChange(evt) {
    const newType = evt.target.innerText || evt.target.textContent;
    this.element.changeType(newType);
  }

  /**
   * Are high precision values available?
   *
   * @returns {boolean} if high precision values are available.
   */
  isHighPrecision() {
    return this.props.version >= HP_VERSION;
  }

  toggleOpenClass(isOpen = !this.state.isOpen) {
    this.setState({ isOpen });
  }

  /**
   * Render the type list dropdown.
   *
   * @returns {Component} The react component.
   */
  renderDropdown() {
    return (
      <div className={this.getClassName()}>
        <button
          className="btn-crud"
          type="button"
          tabIndex="0"
          id="types-dropdown"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded={this.state.isOpen}
          onClick={() => this.toggleOpenClass()}
          onBlur={() => this.toggleOpenClass(false)}
          ref={this.props.buttonRef ? this.props.buttonRef : () => {}}
        >
          {this.element.currentType}
          <span className="caret" />
        </button>
        <ul className="dropdown-menu" aria-labelledby="types-dropdown">
          {this.renderTypes()}
        </ul>
      </div>
    );
  }

  /**
   * Render the types
   *
   * @returns {Component} The react component.
   */
  renderTypes() {
    return TypeChecker.castableTypes(this.isHighPrecision()).map((type) => {
      return (
        <li key={type}>
          {/* TODO: COMPASS-5847 Remove eslint disables: */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <span
            className={`editable-element-type-${type.toLowerCase()}`}
            onMouseDown={this.handleTypeChange.bind(this)}
          >
            {type}
          </span>
        </li>
      );
    });
  }

  /**
   * Render a type list.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return this.renderDropdown();
  }
}

Types.displayName = 'Types';

Types.propTypes = {
  element: PropTypes.object.isRequired,
  version: PropTypes.string.isRequired,
  className: PropTypes.string,
  buttonRef: PropTypes.any,
};

export default Types;
