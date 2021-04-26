import React from 'react';
import PropTypes from 'prop-types';
import outsideClickable from 'react-click-outside';
import getComponent from 'hadron-react-bson';

/**
 * The BEM base style name for the element.
 */
const BEM_BASE = 'line-number';

/**
 * The menu class.
 */
const MENU_CLASS = `${BEM_BASE}-menu`;

/**
 * The field name class.
 */
const FIELD_NAME_CLASS = `${MENU_CLASS}-field`;

/**
 * The default text.
 */
const DEFAULT_TEXT = 'Add Field After ';

/**
 * Object text.
 */
const OBJECT_TEXT = 'Add Field To ';

/**
 * Array text.
 */
const ARRAY_TEXT = 'Add Array Element To ';

/**
 * Array element text.
 */
const ARRAY_ELEMENT_TEXT = 'Add Array Element After ';

/**
 * Add child icon.
 */
const ADD_CHILD_ICON = 'fa fa-level-down fa-rotate-90';

/**
 * Add field icon.
 */
const ADD_FIELD_ICON = 'fa fa-plus-square-o';

/**
 * Line number component.
 */
class LineNumber extends React.Component {
  /**
   * Instantiate the line number component.
   *
   * @param {Object} props - The props.
   */
  constructor(props) {
    super(props);
    this.state = { menu: false };
  }

  /**
   * Class name for line number div.
   *
   * @returns {String} The class name.
   */
  divClassName() {
    return this.state.menu ? `${BEM_BASE} ${BEM_BASE}-is-selected` : BEM_BASE;
  }

  /**
   * Handle click on the line number.
   */
  handleClick() {
  // Provide menu for _id because it's top-level, but not for any potential children.
    if (this.props.element.isParentEditable()) {
      this.setState({menu: !this.state.menu});
    }
  }

  /**
   * Handle key press for enter on the line number.
   *
   * @param {Object} event    The DOM event
   */
  handleKeyPress(event) {
    if (event.key === 'Enter' && this.props.element.isParentEditable()) {
      this.setState({menu: !this.state.menu});
    }
  }

  /**
   * Handle clicking outside the element.
   */
  handleClickOutside() {
    this.setState({ menu: false });
  }

  /**
   * When clicking on a hotspot we append or remove on the parent.
   */
  handleAddFieldClick() {
    this.props.element.next();
    this.setState({ menu: false });
  }

  /**
   * When clicking on an expandable element to append a child.
   */
  handleAddChildClick() {
    this.props.element.insertPlaceholder();
    this.setState({ menu: false });
  }

  /**
   * Is the current element an object?
   *
   * @returns {Boolean} If the element is an object.
   */
  isElementObject() {
    return this.props.element.currentType === 'Object';
  }

  /**
   * Is the current element an array?
   *
   * @returns {Boolean} If the element is an array.
   */
  isElementArray() {
    return this.props.element.currentType === 'Array';
  }

  /**
   * Is the parent of this element an array?
   *
   * @returns {Boolean} If the parent element is an array.
   */
  isParentArray() {
    return !this.props.element.parent.isRoot() &&
        this.props.element.parent.currentType === 'Array';
  }

  /**
   * Class name for the menu.
   *
   * @returns {String} The class name.
   */
  menuClassName() {
    return this.state.menu ?
      `${MENU_CLASS} ${MENU_CLASS}-is-visible dropdown-menu` : `${MENU_CLASS} dropdown-menu`;
  }

  /**
   * Render an array menu item.
   *
   * @returns {React.Component} The component.
   */
  renderArrayItem() {
    if (this.isElementArray() && this.props.element.isValueEditable()) {
      return this.renderMenuItem(
        ADD_CHILD_ICON,
        ARRAY_TEXT,
        this.handleAddChildClick.bind(this),
        'add-element-to-array'
      );
    }
  }

  /**
   * Render the default menu item.
   *
   * @returns {React.Component} The component.
   */
  renderDefaultItem() {
    const text = this.isParentArray() ? ARRAY_ELEMENT_TEXT : DEFAULT_TEXT;
    return this.renderMenuItem(
      ADD_FIELD_ICON,
      text,
      this.handleAddFieldClick.bind(this),
      'add-field-after'
    );
  }

  /**
   * Render the value of the element.
   *
   * @returns {React.Component} The value component.
   */
  renderValue() {
    const component = getComponent(this.props.element.currentType);
    return React.createElement(
      component,
      { type: this.props.element.currentType, value: this.props.element.currentValue }
    );
  }

  /**
   * Render the identifier in the menu. For objects and arrays in an array,
   * this is the type, because the type is already part of the message. For other
   * values inside arrays, it's the actual value. Otherwise it's the key.
   *
   * @returns {String} The field name or value if an array element.
   */
  renderIdentifier() {
    // this case is already handled in renderDefaultItem()
    if (this.isParentArray() && (this.isElementObject() || this.isElementArray())) {
      return this.props.element.currentType;
    }
    return this.props.element.currentKey || this.renderValue();
  }

  /**
   * Render a single menu item.
   *
   * @param {String} iconClassName - The icon class name.
   * @param {String} text - The text.
   * @param {Function} handler - The click handler.
   * @param {String} testId - The test id.
   *
   * @returns {Component} the menu item component
   */
  renderMenuItem(iconClassName, text, handler, testId) {
    return (
      <li onClick={handler} data-test-id={testId}>
        <span>
          <i className={iconClassName} />
          {text}
          <span className={FIELD_NAME_CLASS}>{this.renderIdentifier()}</span>
        </span>
      </li>
    );
  }

  /**
   * Render an object menu item.
   *
   * @returns {React.Component} The component.
   */
  renderObjectItem() {
    if (this.isElementObject() && this.props.element.isValueEditable()) {
      return this.renderMenuItem(
        ADD_CHILD_ICON,
        OBJECT_TEXT,
        this.handleAddChildClick.bind(this),
        'add-child-to-object'
      );
    }
  }

  /**
   * Render the menu.
   *
   * @returns {React.Component} The menu.
   */
  renderMenu() {
    return (
      <ul className={this.menuClassName()}>
        {this.renderObjectItem()}
        {this.renderArrayItem()}
        {this.renderDefaultItem()}
      </ul>
    );
  }

  /**
   * Render the line number.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={this.divClassName()}
        onClick={this.handleClick.bind(this)}
        onKeyPress={this.handleKeyPress.bind(this)}
        onBlur={this.handleClickOutside.bind(this)}
        tabIndex="0">
        {this.renderMenu()}
      </div>
    );
  }
}

LineNumber.displayName = 'LineNumber';

LineNumber.propTypes = {
  element: PropTypes.object.isRequired
};

export default outsideClickable(LineNumber);
