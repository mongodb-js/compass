const app = require('hadron-app');
const React = require('react');
const PropTypes = require('prop-types');
const { Tooltip } = require('hadron-react-components');
const initEditors = require('./editor/');

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
 * The version at which high precision values are available.
 */
const HP_VERSION = '3.4.0';

/**
 * Invalid type class.
 */
const INVALID = `${VALUE_CLASS}-is-invalid-type`;

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
    this._version = app.instance.build.version;
    this._editors = initEditors(this.element);
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
   * Get the editor for the current type.
   *
   * @returns {Editor} The editor.
   */
  editor() {
    return this._editors[this.element.currentType] || this._editors.Standard;
  }

  /**
   * Is the element auto-focusable?
   *
   * @returns {Boolean} If the element can be focused automatically.
   */
  isAutoFocusable() {
    return !this.element.isKeyEditable();
  }

  /**
   * Are high precision values available?
   *
   * @returns {boolean} if high precision values are available.
   */
  isHighPrecision() {
    return this._version >= HP_VERSION;
  }

  /**
   * When hitting a key on the last element some special things may happen.
   *
   * @param {Event} evt - The event.
   */
  handleKeyDown(evt) {
    if (evt.keyCode === 9 && !evt.shiftKey) {
      this.simulateTab(evt);
    } else if (evt.keyCode === ESC) {
      const value = evt.target.value;
      if (value.length === 0 && this.element.currentKey.length === 0) {
        this.element.remove();
      } else {
        this._node.blur();
      }
    } else if (evt.keyCode === 13) {
      if (this.element.nextElement) {
        // need to force the focus.
        this._node.parentNode.parentNode.nextSibling.childNodes[2].focus();
      }
      this.simulateTab(evt);
    }
  }

  /**
   * Simulates a tab event.
   *
   * @param {Event} evt - The event.
   */
  simulateTab(evt) {
    if (this.isTabable()) {
      if (!this.element.nextElement ||
          this.element.currentValue === '{' ||
          this.element.currentValue === '[') {
        this.element.next();
        evt.preventDefault();
        evt.stopPropagation();
      }
    } else {
      // We don't want to create another element when the current one is blank.
      evt.preventDefault();
      evt.stopPropagation();
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

  /**
   * Is the element tabbable.
   *
   * @returns {Boolean} If the element is tabbable.
   */
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
      this._pasteEdit(value);
    } else {
      this.editor().edit(value);
    }
  }

  /**
   * Edit the field value when using copy/paste.
   *
   * @param {String} value - The value to paste in.
   */
  _pasteEdit(value) {
    try {
      this.editor().paste(value);
    } catch (e) {
      this.editor().edit(value);
    } finally {
      this._pasting = false;
    }
  }

  /**
   * Handle focus on the value.
   */
  handleFocus() {
    this.editor().start();
    this.setState({ editing: true });
  }

  /**
   * Handle blur from the value. Calls complete on the editor and sets the state.
   */
  handleBlur() {
    this.editor().complete();
    this.setState({ editing: false });
  }

  /**
   * Get the style for the value of the element.
   *
   * @returns {String} The value style.
   */
  style() {
    let typeClass = `${VALUE_CLASS}-is-${this.element.currentType.toLowerCase()}`;
    if (!this.element.isCurrentTypeValid()) {
      typeClass = `${typeClass} ${INVALID}`;
    }
    if (this.state.editing) {
      return `${VALUE_CLASS} ${VALUE_CLASS}-${EDITING} ${typeClass}`;
    }
    return `${VALUE_CLASS} ${typeClass}`;
  }

  /**
   * Get the style for the input wrapper.
   *
   * @returns {String} The class name.
   */
  wrapperStyle() {
    return `${VALUE_CLASS}-wrapper ${VALUE_CLASS}-wrapper-is-${this.element.currentType.toLowerCase()}`;
  }

  /**
   * Render a single editable value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const length = (this.editor().size(this.state.editing) * 6.625) + 6.625;
    return (
      <span className={this.wrapperStyle()}>
        <Tooltip
          id={this.element.uuid}
          className="editable-element-value-tooltip"
          border
          getContent={() => { return this.element.invalidTypeMessage; }}/>
        <input
          data-tip=""
          data-for={this.element.uuid}
          ref={(c) => this._node = c}
          type="text"
          style={{ width: `${length}px` }}
          className={this.style()}
          onBlur={this.handleBlur.bind(this)}
          onFocus={this.handleFocus.bind(this)}
          onChange={this.handleChange.bind(this)}
          onKeyDown={this.handleKeyDown.bind(this)}
          onPaste={this.handlePaste.bind(this)}
          value={this.editor().value(this.state.editing)} />
      </span>
    );
  }
}

EditableValue.displayName = 'EditableValue';

EditableValue.propTypes = {
  element: PropTypes.object.isRequired,
  isFocused: PropTypes.bool.isRequired
};

module.exports = EditableValue;
