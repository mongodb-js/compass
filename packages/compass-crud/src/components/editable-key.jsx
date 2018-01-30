import React from 'react';
import PropTypes from 'prop-types';
import chars from 'utils';

/* eslint no-return-assign:0 */

/**
 * The editing class constant.
 */
const EDITING = 'editable-element-field-is-editing';

/**
 * The duplicate key value.
 */
const DUPLICATE = 'editable-element-field-is-duplicate';

/**
 * The document key class.
 */
const KEY_CLASS = 'editable-element-field';

/**
 * Escape key code.
 */
const ESC = 27;

/**
 * Colon key code.
 */
const COLON = 186;

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
    this.state = { duplcate: false, editing: false };
  }

  /**
   * Focus on this field on mount, so the tab can do it's job and move
   * to the value field.
   */
  componentDidMount() {
    if (this.isAutoFocusable() || this.props.isFocused) {
      this._node.focus();
    }
  }

  /**
   * When hitting a key on the last element some special things may happen.
   *
   * @param {Event} evt - The event.
   */
  handleKeyDown(evt) {
    const value = evt.target.value;
    if (evt.keyCode === ESC) {
      if (value.length === 0) {
        this.element.remove();
      } else {
        this._node.blur();
      }
    } else if (evt.keyCode === 13) {
      // Simulate a tab if the user presses enter.
      try {
        this._node.nextSibling.nextSibling.firstChild.focus();
      } catch (e) {
        return;
      }
    }
  }

  /**
   * If they key is a colon, tab to the next input.
   *
   * @param {Object} evt - The event.
   */
  handleKeyUp(evt) {
    if (evt.keyCode === COLON) {
      const value = evt.target.value;
      if (value !== ':') {
        this.element.rename(value.replace(':', ''));
        evt.target.value = '';
        // focus is not always available, this is now guarded
        try {
          this._node.nextSibling.nextSibling.firstChild.focus();
        } catch (e) {
          return;
        }
      }
    }
  }

  /**
   * Handles changes to the element key.
   *
   * @param {Event} evt - The event.
   */
  handleChange(evt) {
    const value = evt.target.value;
    this._node.size = chars(value);
    if (this.isEditable()) {
      if (this.element.isDuplicateKey(value)) {
        this.setState({ duplicate: true });
      } else if (this.state.duplicate) {
        this.setState({ duplicate: false });
      }
      this.element.rename(value);
    }
  }

  /**
   * Handle focus on the key.
   */
  handleFocus() {
    if (this.isEditable()) {
      this.setState({ editing: true });
    }
  }

  /**
   * Handle blur from the key.
   */
  handleBlur() {
    if (this.isEditable()) {
      this.setState({ editing: false });
    }
  }

  /**
   * Is this component auto focusable?
   *
   * This is true if:
   *   - When a new element has been added and is a normal element.
   *   - When not being tabbed into.
   *
   * Is false if:
   *   - When a new array value has been added.
   *   - When the key is _id
   *
   * @returns {Boolean} If the component is editable.
   */
  isAutoFocusable() {
    return this.element.isAdded() && this.isEditable();
  }

  /**
   * Is the key able to be edited?
   *
   * @returns {Boolean} If the key can be edited.
   */
  isEditable() {
    return this.element.isKeyEditable() && this.element.parent.currentType !== 'Array';
  }

  /**
   * Get the style for the key of the element.
   *
   * @returns {String} The key style.
   */
  style() {
    let style = KEY_CLASS;
    if (this.state.editing) {
      style = style.concat(` ${EDITING}`);
    }
    if (this.state.duplicate) {
      style = style.concat(` ${DUPLICATE}`);
    }
    return style;
  }

  /**
   * Render the value of the key.
   *
   * @returns {String} The value for the key.
   */
  renderValue() {
    return this.element.parent.currentType === 'Array' ? this.props.index : this.element.currentKey;
  }

  /**
   * Render the title.
   *
   * @returns {String} The title.
   */
  renderTitle() {
    if (this.state.duplicate) {
      return `Duplicate key: '${this.element.currentKey}' - this will overwrite previous values.`;
    }
    return this.element.currentKey;
  }

  /**
   * Render a single editable key.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const length = (chars(this.renderValue()) * 6.625) + 6.625;
    return (
      <input
        className={this.style()}
        ref={(c) => this._node = c}
        type="text"
        style={{ width: `${length}px` }}
        tabIndex={this.isEditable() ? 0 : -1}
        onBlur={this.handleBlur.bind(this)}
        onFocus={this.handleFocus.bind(this)}
        onChange={this.handleChange.bind(this)}
        onKeyDown={this.handleKeyDown.bind(this)}
        onKeyUp={this.handleKeyUp.bind(this)}
        value={this.renderValue()}
        title={this.renderTitle()} />
    );
  }
}

EditableKey.displayName = 'EditableKey';

EditableKey.propTypes = {
  element: PropTypes.object.isRequired,
  index: PropTypes.number,
  isFocused: PropTypes.bool.isRequired
};

export default EditableKey;
