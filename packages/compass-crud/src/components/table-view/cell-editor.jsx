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
 * The document field class.
 */
const FIELD_CLASS = 'editable-element-field';

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
    this.state = { fieldName: '', changed: false };
  }

  componentWillMount() {
    this.element = this.props.value;
    this.wasEmpty = false;
    this.newField = false;

    /* If there was no value in the cell */
    if (this.element === undefined) {
      this.wasEmpty = true;
      /* If the column is of one type, then make the new value that type.
         Otherwise, set it to undefined. Set the key name to be the columnId */
      const key = this.props.column.getColDef().headerName;
      let type = this.props.column.getColDef().headerComponentParams.bsonType;
      if (type === 'mixed') {
        type = 'Undefined';
      }
      this.element = this.props.node.data.hadronDocument.insertEnd(key, '');
      const value = TypeChecker.cast(null, type);
      this.element.edit(value);
    } else {
      /* Only use fieldName if this is reopening a newly added field */
      if (this.element.currentKey !== '$new') {
        this.setState({fieldName: this.element.currentKey});
      }
      /* If this column has just been added, or the user has re-opened a field
       * that has been added but not updated to the DB. */
      this.newField = (this.props.value.key === '$new');
    }

    this.oldType = this.element.currentType;
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
   * @returns {boolean} If the edit should go through.
   */
  isCancelAfterEnd() {
    this.editor().complete();
    const id = this.props.node.data.hadronDocument.getId().toString();

    /* If this is a new field, need to update the colDef with the key name */
    if (this.newField) {
      const key = this.state.fieldName;

      /* Cancel and remove the column bc neither the key or value was edited */
      if ((key === '' && this.editor().value() === '')) {
        this.element.revert();
        Actions.removeColumn('$new');
        return false;
      }

      /* Don't let users save fields that are duplicates (it will break the grid).
       * If a user adds a duplicate key, the key gets reset to empty. */
      if (!this.isDuplicateKey(key)) {
        /* Rename the element within HadronDocument */
        this.element.rename(key);

        /* Rename the column + update its definition */
        const colDef = this.props.column.getColDef();
        colDef.valueGetter = function(params) {
          return params.data.hadronDocument.get(key);
        };
        colDef.headerName = key;
        colDef.colId = key;
        colDef.editable = function(params) {
          if (params.node.data.state === 'deleting') {
            return false;
          }
          if (params.node.data.hadronDocument.get(key) === undefined) {
            return true;
          }
          return params.node.data.hadronDocument.get(key).isValueEditable();
        };

        /* Update the grid store so we know what type this element is. This
         * will also refresh the header API */
        Actions.elementAdded(this.element.currentKey, this.element.currentType, id);

        /* TODO: should we update column.* as well to be safe?
         Not needed if everywhere we access columns through .getColDef() but
         if somewhere internally they don't do that, will have outdated values.
         Docs: https://www.ag-grid.com/javascript-grid-column-definitions
         */
      } else {
        this.element.currentKey = undefined;
      }
    } else if (this.wasEmpty) {
      if (!this.state.changed) {
        this.element.revert();
        return false;
      }
      /* Update the grid store so we know what type this element is */
      Actions.elementAdded(this.element.currentKey, this.element.currentType, id);
    } else if (this.element.isRemoved()) {
      /* Update the grid store so we know that the header should not include this type */
      Actions.elementRemoved(this.element.currentKey, id, false);
    } else if (this.element.currentType !== this.oldType) {
      /* Update the grid store since the element has changed type */
      Actions.elementTypeChanged(this.element.currentKey, this.element.currentType, id);
    }
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

  handleTypeChange() {
    this.setState({changed: true});
    this.props.api.stopEditing();
  }

  handleRemoveField() {
    if (this.element.isRemovable()) {
      const oid = this.props.node.data.hadronDocument.getId().toString();
      this.element.remove();
      if (this.wasEmpty) {
        this.element = undefined; // return state to undefined
      } else if (this.newField) {
        Actions.elementRemoved(this.element.currentKey, oid, true);
      }
      this.props.api.stopEditing();
    }
  }

  handleDrillDown() {}

  handleChange(event) {
    this.setState({changed: true});
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

  isDuplicateKey(value) {
    const cols = this.props.columnApi.getAllColumns();
    for (let i = 0; i < cols.length; i++) {
      if (cols[i].getColDef().colId === value) {
        return true;
      }
    }
    return false;
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
   * Get the style for the field name.
   *
   * @param {boolean} input - If the style is the input form.
   * @returns {String} The key style.
   */
  styleField(input) {
    let base = `${FIELD_CLASS}`;
    if (input) {
      base = `${base}`;
      if (this.isDuplicateKey(this.state.fieldName)) {
        base = `${base}-is-duplicate`;
      }
    }
    return base;
  }

  /**
   * Get the style for the value of the element.
   *
   * @returns {String} The value style.
   */
  styleValue() {
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
    if (this.newField && this.element.currentKey === '$new') {
      return (
        <div className={`${BEM_BASE}-input ${BEM_BASE}-input-field`}>
          <span className={`${BEM_BASE}-input-field-inner`}>
            <input
              type="text"
              onChange={this.handleFieldNameChange.bind(this)}
              className={this.styleField(true)}
              value={this.state.fieldName}
              placeholder="Field Name"/>
          </span>
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
      <div onBlur={this.handleTypeChange.bind(this)}>
        <Types element={this.element} className={`${BEM_BASE}-types btn btn-default btn-xs`}/>
      </div>
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
              className={this.styleValue()}
              onChange={this.handleChange.bind(this)}
              // onKeyDown={this.handleKeyDown.bind(this)}
              onPaste={this.handlePaste.bind(this)}
              value={this.editor().value(true)}
              placeholder="Value"/>
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
        <div className={`${BEM_BASE}-button btn btn-default btn-xs`} onMouseDown={this.handleDrillDown}>
          <FontAwesome name="expand" className={`${BEM_BASE}-button-icon`}/>
        </div>
      );
    }
    return null;
  }

  /**
   * Render the "remove field" button if the element is not am empty field
   *
   * @returns {React.Component} The component.
   */
  renderRemoveField() {
    if (!this.wasEmpty) {
      return (
        <div className={`${BEM_BASE}-button btn btn-default btn-xs`}
             onMouseDown={this.handleRemoveField.bind(this)}>
          <FontAwesome name="trash" className={`${BEM_BASE}-button-icon`}/>
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
    if (this.element.currentKey !== '$new') {
      return (
        <span className={`${BEM_BASE}-actions`}>
          {this.renderExpand()}
          <AddFieldButton {...this.props}
            displace={displace}
          />
          {this.renderRemoveField()}
        </span>
      );
    }
    return null;
  }

  render() {
    let displace = 211;
    if (this.element.currentType === 'Object' || this.element.currentType === 'Array') {
      displace = 120;
    }

    return (
      <div className={BEM_BASE}>
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
