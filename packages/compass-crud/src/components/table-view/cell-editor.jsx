const React = require('react');
const ReactDOM = require('react-dom');
const PropTypes = require('prop-types');

const initEditors = require('../editor/');
const Types = require('../types');
const FontAwesome = require('react-fontawesome');
const { Tooltip } = require('hadron-react-components');

// const util = require('util');

/**
 * The document value class.
 */
const VALUE_CLASS = 'editable-element-value';

/**
 * Invalid type class.
 */
const INVALID = `${VALUE_CLASS}-is-invalid-type`;

/**
 * The custom cell editor for the table view.
 */
class CellEditor extends React.Component {
  constructor(props) {
    super(props);
    this.element = props.value;

    this._editors = initEditors(props.value);
  }

  componentWillMount() {
    this.editor().start();
  }

  componentDidMount() {
    // this.props.reactContainer.addEventListener('keydown', this.onKeyDown);
    this.focus();
  }

  componentDidUpdate() {
    this.focus();
  }

  componentWillUnmount() {
    // this.props.reactContainer.removeEventListener('keydown', this.onKeyDown);
  }

  // /**
  //  * This is only required if you are preventing event propagation.
  //  * @param {Object} event
  //  */
  // handleKeyDown(event) {
  // }

  /**
   * AG-Grid API call to get final result of editing. Not being used because
   * changes are tracked with HadronDocument internally, so we don't need to
   * set it using the API (for now).
   *
   * @returns {*} The value that will be set.
   */
  getValue() {
    this.editor().complete();
    return this.editor().value();
  }

  /**
   * Determines if the editor can take up more space than just 1 cell.
   * @returns {boolean}
   */
  isPopup() {
    return true;
  }

  focus() {
    // TODO: why this?
    setTimeout(() => {
      const container = ReactDOM.findDOMNode(this.props.reactContainer);
      if (container) {
        container.focus();
      }
    });
  }

  handleAddField() {
    console.log('add field');
  }

  handleRemoveField() {
    console.log('remove field');
  }

  handleDrillDown() {
    console.log('drill down');
  }

  handleChange(event) {
    if (this._pasting) {
      this._pasteEdit(event.target.value);
    } else {
      this.editor().edit(event.target.value);
    }
    this.forceUpdate();
  }

  handlePaste() {
    this._pasting = true;
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
   * Get the editor for the current type.
   *
   * @returns {Editor} The editor.
   */
  editor() {
    return this._editors[this.element.currentType] || this._editors.Standard;
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
    return `${VALUE_CLASS} ${VALUE_CLASS}-is-editing ${typeClass}`;
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
   * Render the types column.
   *
   * @returns {React.Component} The component.
   */
  renderTypes() {
    return (
      <Types element={this.element} className="table-view-cell-editor"/>
    );
  }

  /**
   * Render the input field.
   *
   * @returns {React.Component} The component.
   */
  renderInput() {
    const length = 120; // TODO: styles
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
          ref={(c) => {this._node = c;}}
          type="text"
          style={{ width: `${length}px` }}
          className={this.style()}
          onChange={this.handleChange.bind(this)}
          // onKeyDown={this.handleKeyDown.bind(this)}
          onPaste={this.handlePaste.bind(this)}
          value={this.editor().value(true)} />
      </span>
    );
  }

  renderDrillDown() {
    if (this.element.currentType === 'Object' || this.element.currentType === 'Array') {
      return (
        <button
          className="table-view-cell-editor-button"
          onClick={this.handleDrillDown}
        >
          <FontAwesome name="forward" className="table-view-cell-editor-button-icon"/>
        </button>
      );
    }
    return null;
  }

  /**
   * Render the add field/delete field buttons. If the element is an object or
   * an array, provide a "drill down" button.
   *
   * @returns {React.Component} The component.
   */
  renderActions() {
    return (
      <span className="table-view-cell-editor-actions">
        {this.renderDrillDown()}
        <button
          className="table-view-cell-editor-button"
          onClick={this.handleAddField}
        >
          <FontAwesome name="plus-square-o" className="table-view-cell-editor-button-icon"/>
        </button>
        <button
        className="table-view-cell-editor-button"
        onClick={this.handleRemoveField}
        >
          <FontAwesome name="trash" className="table-view-cell-editor-button-icon"/>
        </button>
      </span>
    );
  }

  render() {
    return (
      <div className="table-view-cell-editor">
        {this.renderInput()}
        {this.renderTypes()}
        {this.renderActions()}
      </div>
    );
  }
}

CellEditor.propTypes = {
  reactContainer: PropTypes.any,
  value: PropTypes.any
};

CellEditor.displayName = 'CellEditor';

module.exports = CellEditor;
