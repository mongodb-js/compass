const React = require('react');
const ReactDOM = require('react-dom');
const PropTypes = require('prop-types');
const FontAwesome = require('react-fontawesome');

const { Tooltip } = require('hadron-react-components');
const TypeChecker = require('hadron-type-checker');

const Actions = require('../../actions');
const initEditors = require('../editor/');
const Types = require('../types');
const AddFieldButton = require('./add-field-button');

// const util = require('util');

/**
 * BEM BASE
 */
const BEM_BASE = 'table-view-cell-editor';

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
    this.state = { fieldName: 'New Field' };
  }

  componentWillMount() {
    this.element = this.props.value;
    this.wasEmpty = false;
    this.newField = false;

    /* If there was no value in the cell */
    if (this.element === undefined) {
      this.wasEmpty = true;
      const key = this.props.column.getColDef().headerName;
      let type = this.props.column.getColDef().headerComponentParams.bsonType;
      if (type === 'mixed') {
        type = 'Undefined';
      }
      this.element = this.props.node.data.hadronDocument.insertEnd(key, '');
      const value = TypeChecker.cast(null, type);
      this.element.edit(value);
    } else {
      /* If this column has just been added */
      this.newField = (this.props.value.currentKey === '$new');
    }

    this._editors = initEditors(this.element);
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
    return this.element;
  }

  /**
   * AG-Grid API call to do a final check before closing the. Returning false
   * will cancel editing.
   *
   * @returns {Bool} If the edit should go through.
   */
  isCancelAfterEnd() {
    this.editor().complete();

    /* If this is a new field, need to update the colDef with the key name */
    if (this.newField) {
      const key = this.state.fieldName;

      if (this.element.isDuplicateKey(key) || key.includes('$') || key.includes(' ')) {
        this.element.revert();
        Actions.removeColumn('$new');
        return false;
      }

      /* Rename the element within HadronDocument */
      this.element.rename(key);

      /* Rename the column + update its definition */
      const colDef = this.props.column.getColDef();
      colDef.headerName = key;
      colDef.colId = key;
      colDef.valueGetter = function(params) {
        return params.data.hadronDocument.get(key);
      };
      colDef.headerComponentParams.bsonType = this.element.currentType;
      colDef.editable = function(params) {
        if (params.node.data.state === 'deleting') {
          return false;
        }
        if (params.node.data.hadronDocument.get(key) === undefined) {
          return true;
        }
        return params.node.data.hadronDocument.get(key).isValueEditable();
      };

      /* TODO: should we update column.* as well to be safe?
         Not needed if everywhere we access columns through .getColDef() but
         if somewhere internally they don't do that, will have outdated values.
         Docs: https://www.ag-grid.com/javascript-grid-column-definitions
       */

      this.props.api.refreshHeader();
    }
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

  handleRemoveField() {
    if (this.element.isRemovable()) {
      this.element.remove();
      if (this.wasEmpty) {
        this.element = undefined; // return state to undefined
      }
      this.props.api.stopEditing();
    }
  }

  handleDrillDown() {}

  handleChange(event) {
    if (this._pasting) {
      this._pasteEdit(event.target.value);
    } else {
      this.editor().edit(event.target.value);
    }
    this.forceUpdate();
  }

  handleFieldNameChange(event) {
    this.setState({fieldName: event.target.value});
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
   * Render the field name if the element is being added.
   *
   * @returns {React.Component} The component.
   */
  renderFieldName() {
    if (this.newField) {
      return (
        <div className={`${BEM_BASE}-field-name`}>
          <input
            type="text"
            style={{ width: '100px' }}
            onChange={this.handleFieldNameChange.bind(this)}
            className={`${BEM_BASE}-field-name-input`}
            value={this.state.fieldName}/>
        </div>
      );
    }
    return null;
  }

  /**
   * Render the types column.
   *
   * @returns {React.Component} The component.
   */
  renderTypes() {
    return (
      <Types element={this.element} className={BEM_BASE}/>
    );
  }

  /**
   * Render the input field if the element is not an object or an array.
   *
   * @returns {React.Component} The component.
   */
  renderInput() {
    if (this.element.currentType !== 'Object' && this.element.currentType !== 'Array') {
      const length = 100; // TODO: styles
      return (
        <div className={`${BEM_BASE}-input`}>
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
              style={{ width: `${length}px`}}
              className={this.style()}
              onChange={this.handleChange.bind(this)}
              // onKeyDown={this.handleKeyDown.bind(this)}
              onPaste={this.handlePaste.bind(this)}
              value={this.editor().value(true)}/>
          </span>
        </div>
      );
    }
    return null;
  }

  /**
   * Render the "expand" button if the element is an array or object.
   *
   * @returns {React.Component} The component.
   */
  renderExpand() {
    if (this.element.currentType === 'Object' || this.element.currentType === 'Array') {
      return (
        <div className={`${BEM_BASE}-button`} onClick={this.handleDrillDown}>
          <FontAwesome name="forward" className={`${BEM_BASE}-button-icon`}/>
        </div>
      );
    }
    return null;
  }

  /**
   * Render the add field/delete field buttons. If the element is an object or
   * an array, provide a "expand" button.
   *
   * @param {Number} displace - The distance to push the add-field dropdown.
   *
   * @returns {React.Component} The component.
   */
  renderActions(displace) {
    if (!this.newField) {
      return (
        <span className={`${BEM_BASE}-actions`}>
          {this.renderExpand()}
          <AddFieldButton {...this.props}
            displace={displace}
          />
          <div className={`${BEM_BASE}-button`}
               onClick={this.handleRemoveField.bind(this)}>
            <FontAwesome name="trash" className={`${BEM_BASE}-button-icon`}/>
          </div>
        </span>
      );
    }
    return null;
  }

  render() {
    let width = 258;
    let displace = 211;
    if (this.newField) {
      width = 316;
    } else if (this.element.currentType === 'Object' || this.element.currentType === 'Array') {
      width = 170;
      displace = 120;
    }
    return (
      <div className={BEM_BASE} style={{width: `${width}px`}}>
        {this.renderFieldName()}
        {this.renderInput()}
        {this.renderTypes()}
        {this.renderActions(displace)}
      </div>
    );
  }
}

CellEditor.propTypes = {
  reactContainer: PropTypes.any,
  value: PropTypes.any,
  column: PropTypes.any,
  node: PropTypes.any,
  api: PropTypes.any,
  columnApi: PropTypes.any
};

CellEditor.displayName = 'CellEditor';

module.exports = CellEditor;
