'use strict';

const React = require('react');

/**
 * The editing class constant.
 */
const EDITING = 'editing';

/**
 * The document key class.
 */
const KEY_CLASS = 'editable-key';

/**
 * General editable key component.
 */
class EditableKey extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
    this.state = { key: this.element.currentKey, editing: false };
  }

  /**
   * Render a single editable key.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <input
        type='text'
        className={this.style()}
        size={this.element.currentKey.length}
        onBlur={this.handleBlur.bind(this)}
        onFocus={this.handleFocus.bind(this)}
        onChange={this.handleChange.bind(this)}
        value={this.element.currentKey} />
    );
  }

  /**
   * Handles changes to the element key.
   *
   * @param {Event} evt - The event.
   */
  handleChange(evt) {
    this.element.edit(evt.target.value, this.element.currentValue);
    this.setState({ key: this.element.currentKey });
  }

  /**
   * Handle focus on the key.
   */
  handleFocus() {
    this.setState({ editing: true });
  }

  /**
   * Handle blur from the key.
   */
  handleBlur() {
    this.setState({ editing: false });
  }

  /**
   * Get the style for the key of the element.
   *
   * @returns {String} The key style.
   */
  style() {
    return this.state.editing ? `${KEY_CLASS} ${EDITING}` : KEY_CLASS;
  }
}

EditableKey.displayName = 'EditableKey';

module.exports = EditableKey;
