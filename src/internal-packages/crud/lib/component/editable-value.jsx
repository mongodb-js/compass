'use strict';

const React = require('react');
const ElementFactory = require('hadron-component-registry').ElementFactory;

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
    this.state = { value: this.element.currentValue, editing: false };
  }

  /**
   * Render a single editable value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <input
        type='text'
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
      this.element.next();
    }
  }

  /**
   * Handles changes to the element value.
   *
   * @param {Event} evt - The event.
   */
  handleChange(evt) {
    if (this.element.isValueEditable()) {
      this.element.edit(evt.target.value);
      this.setState({ value: this.element.currentValue });
    }
  }

  /**
   * Handle focus on the value.
   */
  handleFocus() {
    if (this.element.isValueEditable()) {
      this.setState({ editing: true });
    }
  }

  /**
   * Handle blur from the value.
   */
  handleBlur() {
    if (this.element.isValueEditable()) {
      this.setState({ editing: false });
    }
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
