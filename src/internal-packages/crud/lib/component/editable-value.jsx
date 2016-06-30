'use strict';

const _ = require('lodash');
const React = require('react');
const ElementFactory = require('hadron-component-registry').ElementFactory;
const TypeChecker = require('hadron-type-checker');

/**
 * Escape key code.
 */
const ESC = 27;

/**
 * The editing class constant.
 */
const EDITING = 'editing';

/**
 * The document value class.
 */
const VALUE_CLASS = 'editable-value';

/**
 * General editable value component.
 */
class EditableValue extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
    this.state = { editing: false };
  }

  /**
   * Focus on this field on mount, so the tab can do it's job and move
   * to the value field.
   */
  componentDidMount() {
    if (this.isAutoFocusable()) {
      this._node.focus();
    }
  }

  isAutoFocusable() {
    return !this.element.isKeyEditable() ||
      this.element.parentElement.currentType === 'Array';
  }

  /**
   * Render a single editable value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <input
        ref={(c) => this._node = c}
        type='text'
        size={this.element.currentValue ? (this.element.currentValue.length + 1) : 1}
        className={this.style()}
        onBlur={this.handleBlur.bind(this)}
        onFocus={this.handleFocus.bind(this)}
        onChange={this.handleChange.bind(this)}
        onKeyDown={this.handleKeyDown.bind(this)}
        value={this.element.currentValue} />
    );
  }

  /**
   * When hitting a key on the last element some special things may happen.
   *
   * @param {Event} evt - The event.
   */
  handleKeyDown(evt) {
    if (evt.keyCode === 9 && !evt.shiftKey) {
      if (this.element.currentKey.length !== 0) {
        if (this.element.isLast()) {
          // We only stop propogation if the element is last, so the newly added key
          // component can focus on itself.
          this.element.next();
          evt.preventDefault();
          evt.stopPropagation();
        } else {
          this.element.next();
        }
      } else {
        // We don't want to create another element when the current one is blank.
        evt.preventDefault();
        evt.stopPropagation();
      }
    } else if (evt.keyCode === ESC) {
      var value = evt.target.value;
      if (value.length === 0 && this.element.currentKey.length === 0) {
        this.element.remove();
      } else {
        this._node.blur();
      }
    }
  }

  /**
   * Handles changes to the element value.
   *
   * @param {Event} evt - The event.
   */
  handleChange(evt) {
    var value = evt.target.value;
    this._node.size = value.length + 1;
    var currentType = this.element.currentType;
    if (_.includes(TypeChecker.castableTypes(value), currentType)) {
      this.element.edit(TypeChecker.cast(value, currentType));
    } else {
      this.element.edit(value);
    }
  }

  /**
   * Handle focus on the value.
   */
  handleFocus() {
    this.setState({ editing: true });
  }

  /**
   * Handle blur from the value.
   */
  handleBlur() {
    this.setState({ editing: false });
  }

  /**
   * Get the style for the value of the element.
   *
   * @returns {String} The value style.
   */
  style() {
    return this.state.editing ? `${VALUE_CLASS} ${EDITING}` : VALUE_CLASS;
  }
}

EditableValue.displayName = 'EditableValue';

module.exports = EditableValue;
