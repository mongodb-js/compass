'use strict';

const React = require('react');

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
        onKeyUp={this.handleKeyUp.bind(this)}
        value={this.element.currentValue} />
    );
  }

  handleKeyUp(evt) {
    if (evt.keyCode === 13) {
      var value = evt.target.value;
      if (value === '{') {
        this.changeElementToObject();
      } else if (value === '[') {
        this.changeElementToArray();
      } else {
        this.addElementToParent();
      }
    }
  }

  addElementToParent() {
    var parentElement = this.element.parentElement;
    if (parentElement.type === 'Array') {
      var length = parentElement.elements.length;
      parentElement.add(String(length), '');
    } else {
      parentElement.add('', '');
    }
  }

  changeElementToObject() {
    this.element.edit({});
    this.element.add('', '');
  }

  changeElementToArray() {
    this.element.edit([]);
    this.element.add('0', '');
  }

  /**
   * Handles changes to the element value.
   *
   * @param {Event} evt - The event.
   */
  handleChange(evt) {
    if (this.isEditable()) {
      this.element.edit(evt.target.value);
      this.setState({ value: this.element.currentValue });
    }
  }

  /**
   * Handle focus on the value.
   */
  handleFocus() {
    if (this.isEditable()) {
      this.setState({ editing: true });
    }
  }

  /**
   * Handle blur from the value.
   */
  handleBlur() {
    if (this.isEditable()) {
      this.setState({ editing: false });
    }
  }

  isEditable() {
    return this.element.key !== '_id';
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
