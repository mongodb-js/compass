const _ = require('lodash');
const React = require('react');
const inputSize = require('./utils').inputSize;
const TypeChecker = require('hadron-type-checker');

/* eslint no-return-assign:0 */

/**
 * Escape key code.
 */
const ESC = 27;

/**
 * The editing class constant.
 */
const EDITING = 'is-editing';

/**
 * The document value class.
 */
const VALUE_CLASS = 'editable-element-value';

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
    this._pasting = false;
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

  /**
   * Is the element auto-focusable?
   *
   * @returns {Boolean} If the element can be focused automatically.
   */
  isAutoFocusable() {
    return !this.element.isKeyEditable() ||
      this.element.parent.currentType === 'Array';
  }

  /**
   * When hitting a key on the last element some special things may happen.
   *
   * @param {Event} evt - The event.
   */
  handleKeyDown(evt) {
    if (evt.keyCode === 9 && !evt.shiftKey) {
      if (this.isTabable()) {
        if (!this.element.nextElement) {
          this.element.next();
          evt.preventDefault();
          evt.stopPropagation();
        }
      } else {
        // We don't want to create another element when the current one is blank.
        evt.preventDefault();
        evt.stopPropagation();
      }
    } else if (evt.keyCode === ESC) {
      const value = evt.target.value;
      if (value.length === 0 && this.element.currentKey.length === 0) {
        this.element.remove();
      } else {
        this._node.blur();
      }
    }
  }

  /**
   * Sets the flag that the user pasted the value. The reason for this is that
   * the onpaste event that is passed does not have consistent behaviour with
   * respect to event.target.value - it is sometimes undefined. The onchange
   * event always gets fired after this to we can set the flag and then check
   * for it in that event.
   */
  handlePaste() {
    this._pasting = true;
  }

  isTabable() {
    if (this.element.parent.currentType === 'Array') {
      return this.element.currentValue !== '';
    }
    return this.element.currentKey.length !== 0;
  }

  /**
   * Handles changes to the element value.
   *
   * @param {Event} evt - The event.
   */
  handleChange(evt) {
    const value = evt.target.value;
    if (this._pasting) {
      this.element.bulkEdit(value);
      this._pasting = false;
    } else {
      this._node.size = inputSize(value);
      const currentType = this.element.currentType;
      const castableTypes = TypeChecker.castableTypes(value);
      if (_.includes(castableTypes, currentType)) {
        this.element.edit(TypeChecker.cast(value, currentType));
      } else {
        this.element.edit(TypeChecker.cast(value, castableTypes[0]));
      }
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
    const typeClass = `${VALUE_CLASS}-is-${this.element.currentType.toLowerCase()}`;
    if (this.state.editing) {
      return `${VALUE_CLASS} ${VALUE_CLASS}-${EDITING} ${typeClass}`;
    }
    return `${VALUE_CLASS} ${typeClass}`;
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
        type="text"
        size={inputSize(this.element.currentValue)}
        className={this.style()}
        onBlur={this.handleBlur.bind(this)}
        onFocus={this.handleFocus.bind(this)}
        onChange={this.handleChange.bind(this)}
        onKeyDown={this.handleKeyDown.bind(this)}
        onPaste={this.handlePaste.bind(this)}
        value={this.element.currentValue} />
    );
  }
}

EditableValue.displayName = 'EditableValue';

EditableValue.propTypes = {
  element: React.PropTypes.object.isRequired
};

module.exports = EditableValue;
