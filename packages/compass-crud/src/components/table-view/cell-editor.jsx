// TODO: COMPASS-5847 Fix accessibility issues and remove lint disables.
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome';
import { Tooltip } from 'hadron-react-components';
import TypeChecker from 'hadron-type-checker';
import { ElementEditor as initEditors } from 'hadron-document';
import TypesDropdown from './types-dropdown';
import AddFieldButton from './add-field-button';

const EMPTY_TYPE = {
  Array: [],
  Object: {},
  Decimal128: 0,
  Int32: 0,
  Int64: 0,
  Double: 0,
  MaxKey: 0,
  MinKey: 0,
  Timestamp: 0,
  Date: 0,
  String: '',
  Code: '',
  Binary: '',
  ObjectId: '',
  BSONRegExp: '',
  Symbol: '',
  Boolean: false,
  Undefined: undefined,
  Null: null,
};

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
    this.state = { fieldName: '' };
    this.changed = false;
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  /**
   * Mount the component. If the editor is opened and there was no field defined
   * in this cell, get the type of the column from this.props.column and add a
   * field to the HadronDocument that is empty.
   */
  UNSAFE_componentWillMount() {
    this.element = this.props.value;
    this.wasEmpty = false;
    this.newField = false;

    let parent = this.props.node.data.hadronDocument;
    if (this.props.context.path.length) {
      parent = parent.getChild(this.props.context.path);
    }

    /* If expanding an empty element */
    if (
      this.element === undefined &&
      this.props.column.getColDef().headerName === '$new'
    ) {
      this.wasEmpty = true;

      this.element = parent.insertEnd('$new', '');
      this.newField = true;
    } else if (this.element === undefined) {
      /* field was empty */
      this.wasEmpty = true;
      /* If the column is of one type, then make the new value that type.
         Otherwise, set it to undefined. Set the key name to be the columnId */
      const key = this.props.column.getColDef().headerName;
      let type = this.props.column.getColDef().headerComponentParams.bsonType;
      if (type === 'Mixed') {
        type = 'String';
      }

      const value = TypeChecker.cast(EMPTY_TYPE[type], type);
      this.element = parent.insertEnd(key, value);
      this.element.edit(value);
    } else {
      /* Only use fieldName if this a newly added field */
      if (this.element.currentKey !== '$new') {
        this.setState({ fieldName: this.element.currentKey });
      }
      /* If this column has just been added */
      this.newField = this.props.value.currentKey === '$new';
    }

    this.oldType = this.element.currentType;
    this._editors = initEditors(this.element, this.props.tz);
    this.editor().start();
  }

  componentDidMount() {
    if (this.props.eGridCell) {
      this.props.eGridCell.addEventListener('keydown', this.onKeyDown);
    }
    this.nodes = [
      this.fieldNameNode,
      this.inputNode,
      this.typesNode,
      this.expandNode,
      this.addFieldNode,
      this.removeNode,
    ];
    this.nodeIndex = 1;
    this.maxNodes = this.nodes.length - 1;
    while (this.nodes[this.maxNodes] === undefined) {
      this.maxNodes--;
    }
    this.minNodes = 0;
    while (this.nodes[this.minNodes] === undefined) {
      this.minNodes++;
    }
  }

  componentWillUnmount() {
    if (this.props.eGridCell) {
      this.props.eGridCell.removeEventListener('keydown', this.onKeyDown);
    }
    this.props.api.stopEditing();
  }

  /**
   * Hotkeys
   *
   * @param {Object} event
   */
  onKeyDown(event) {
    /* eslint complexity: 0 */
    event.stopPropagation();
    if (event.keyCode === 27 || event.keyCode === 13) {
      this.props.api.stopEditing();
    }
    if (event.shiftKey && event.keyCode === 9) {
      event.preventDefault();
      while (this.nodeIndex > -1 && this.nodes[this.nodeIndex] === undefined) {
        this.nodeIndex--;
      }
      const node = this.nodes[this.nodeIndex];
      if (this.nodeIndex <= this.minNodes || node === undefined) {
        this.props.api.tabToPreviousCell();
      } else {
        node.focus();
        this.nodeIndex--;
      }
    } else if (event.keyCode === 9) {
      event.preventDefault();
      while (this.nodeIndex < 6 && this.nodes[this.nodeIndex] === undefined) {
        this.nodeIndex++;
      }
      const node = this.nodes[this.nodeIndex];
      if (this.nodeIndex > this.maxNodes || node === undefined) {
        this.props.api.tabToNextCell();
      } else {
        node.focus();
        this.nodeIndex++;
      }
    }
  }

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
   * AG-Grid API call to do a final check before closing the editor. Returning
   * false will cancel editing.
   *
   * Update the column headers if the type has changed or if the column is brand
   * new.
   *
   * @returns {boolean} If the edit should go through.
   */
  isCancelAfterEnd() {
    this.editor().complete();
    const id = this.props.node.data.hadronDocument.getStringId();

    /* If this is a new field, need to update the colDef with the key name */
    if (this.newField) {
      const key = this.state.fieldName;
      const path = [].concat(this.props.context.path, [key]);

      /* Cancel and remove the column if the key was unedited or a duplicate */
      // TODO: Applies to objects, not arrays.
      if (key === '' || this.isDuplicateKey(key)) {
        this.element.revert();
        this.props.removeColumn('$new');
        return false;
      }

      /* Rename the element within HadronDocument */
      this.props.renameColumn(this.element.currentKey, key);
      this.element.rename(key);

      /* Rename the column + update its definition */
      const colDef = this.props.column.getColDef();
      colDef.valueGetter = function (params) {
        return params.data.hadronDocument.getChild(path);
      };
      colDef.headerName = key;
      colDef.colId = key;
      colDef.editable = function (params) {
        return params.node.data.state !== 'deleting';
      };
      this.props.api.refreshHeader();
    } else if (this.wasEmpty) {
      if (!this.changed) {
        this.element.revert();
        return false;
      }
    } else if (
      !this.element.isAdded() &&
      !this.element.isRemoved() &&
      this.element.currentType !== this.oldType
    ) {
      /* Update the grid store since the element has changed type */
      this.props.elementTypeChanged(
        this.element.currentKey,
        this.element.currentType,
        id
      );
    }
    if (!this.element.isRemoved() && this.element.isAdded()) {
      /* Update the grid store so we know what type this element is */
      this.props.elementAdded(
        this.element.currentKey,
        this.element.currentType,
        id
      );
      /* TODO: should we update column.* as well to be safe?
        Not needed if everywhere we access columns through .getColDef() but
        if somewhere internally they don't do that, will have outdated values.
        Docs: https://www.ag-grid.com/javascript-grid-column-definitions
       */
    }
    this.props.api.refreshCells({ rowNodes: [this.props.node], force: true });
  }

  handleTypeChange() {
    /* If we've casted to object or array, need to get rid of any placeholders */
    const type = this.element.currentType;
    if (type !== this.oldType) {
      this.changed = true;
      if (type === 'Array' || type === 'Object') {
        for (const element of this.element.elements) {
          if (
            element.isAdded() &&
            element.currentKey === '' &&
            element.currentValue === ''
          ) {
            element.remove();
          }
        }
      }
    }
    this.forceUpdate();
  }

  handleRemoveField() {
    if (this.element.isRemovable()) {
      const oid = this.props.node.data.hadronDocument.getStringId();

      if (this.wasEmpty) {
        this.element = undefined; // return state to undefined
        return this.props.api.stopEditing();
      }

      if (this.newField || this.element.isAdded()) {
        /* new field not possible */
        const isArray =
          !this.element.parent.isRoot() &&
          this.element.parent.currentType === 'Array';
        this.props.elementRemoved(this.element.currentKey, oid, isArray);
      } else {
        this.props.elementMarkRemoved(this.element.currentKey, oid);
      }
      this.element.remove();
    }
    this.props.api.stopEditing();
  }

  handleDrillDown() {
    this.changed = true;
    this.props.api.stopEditing();
    this.props.drillDown(this.props.node.data.hadronDocument, this.element);
  }

  handleInputChange(event) {
    this.changed = true;
    if (this._pasting) {
      this._pasteEdit(event.target.value);
    } else {
      this.editor().edit(event.target.value);
    }
    this.forceUpdate();
  }

  handleFieldNameChange(event) {
    this.setState({ fieldName: event.target.value });
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
              data-testid="table-view-cell-editor-fieldname-input"
              onChange={this.handleFieldNameChange.bind(this)}
              onClick={() => {
                this.nodeIndex = 1;
              }}
              className={this.styleField(true)}
              value={this.state.fieldName}
              ref={(c) => {
                this.fieldNameNode = c;
              }}
              placeholder="Field Name"
            />
          </span>
        </div>
      );
    }
    return null;
  }

  /**
   * Render the types column.
   *
   * @param {boolean} showTypes - If the element is value editable.
   *
   * @returns {React.Component} The component.
   */
  renderTypes(showTypes) {
    if (!showTypes) {
      return null;
    }
    return (
      <div
        className={`${BEM_BASE}-input-types`}
        onBlur={this.handleTypeChange.bind(this)}
        onClick={() => {
          this.nodeIndex = 3;
        }}
      >
        <TypesDropdown
          element={this.element}
          version={this.props.version}
          className={`${BEM_BASE}-types btn btn-default btn-xs`}
          buttonRef={(c) => {
            this.typesNode = c;
          }}
        />
      </div>
    );
  }

  /**
   * Render the input field if the element is not an object or an array.
   *
   * @param {boolean} showInput - If the element is value editable.
   *
   * @returns {React.Component} The component.
   */
  renderInput(showInput) {
    if (!showInput) {
      return null;
    }
    const length = 100; // TODO: styles
    return (
      <div className={`${BEM_BASE}-input`}>
        <span className={this.wrapperStyle()}>
          <Tooltip
            id={this.element.uuid}
            className="editable-element-value-tooltip"
            border
            getContent={() => {
              return this.element.invalidTypeMessage;
            }}
          />
          <input
            data-testid="table-view-cell-editor-value-input"
            data-tip=""
            data-for={this.element.uuid}
            ref={(c) => {
              this.inputNode = c;
            }}
            type="text"
            style={{ width: `${length}px` }}
            className={this.styleValue()}
            onChange={this.handleInputChange.bind(this)}
            onClick={() => {
              this.nodeIndex = 2;
            }}
            onPaste={this.handlePaste.bind(this)}
            value={this.editor().value(true)}
            placeholder="Value"
          />
        </span>
      </div>
    );
  }

  /**
   * Render the "expand" button if the element is an array or object.

   * @param {boolean} showExpand - If the element is expandable.
   *
   * @returns {React.Component} The component.
   */
  renderExpand(showExpand) {
    if (!showExpand) {
      return null;
    }
    return (
      <button
        type="button"
        data-testid="table-view-cell-editor-expand-button"
        className={`${BEM_BASE}-button btn btn-default btn-xs`}
        onMouseDown={this.handleDrillDown.bind(this)}
        ref={(c) => {
          this.expandNode = c;
        }}
      >
        <FontAwesome name="expand" className={`${BEM_BASE}-button-icon`} />
      </button>
    );
  }

  /**
   * Render the "remove field" button if the element is not am empty field
   *
   * @returns {React.Component} The component.
   */
  renderRemoveField() {
    if (
      this.wasEmpty ||
      (this.element.currentKey === '_id' && !this.props.context.path.length)
    ) {
      return null;
    }
    return (
      <button
        type="button"
        data-testid="table-view-cell-editor-remove-field-button"
        className={`${BEM_BASE}-button btn btn-default btn-xs`}
        onMouseDown={this.handleRemoveField.bind(this)}
        ref={(c) => {
          this.removeNode = c;
        }}
      >
        <FontAwesome name="trash" className={`${BEM_BASE}-button-icon`} />
      </button>
    );
  }

  onAddField() {
    // we have to setImmediate here otherwise there's an untraceable
    // setState on unmounted component error
    setImmediate(() => {
      // we explicitly stop editing first to prevent breaking the UI
      this.props.api.stopEditing();
      this.props.addColumn(...arguments);
    });
  }

  /**
   * Render the add field/delete field buttons. If the element is an object or
   * an array, provide a "expand" button.
   *
   * @param {boolean} showTypes - If the element is castable to another type.
   * @param {boolean} showInput - If the element is value editable.
   * @param {boolean} showExpand - If the element is expandable.
   *
   * @returns {React.Component} The component.
   */
  renderActions(showTypes, showInput, showExpand) {
    if (this.element.currentKey === '$new') {
      return null;
    }

    const displace = 87 * showTypes + 130 * showInput + 23 * showExpand;
    return (
      <span className={`${BEM_BASE}-actions`}>
        {this.renderExpand(showExpand)}
        <span
          onClick={() => {
            this.nodeIndex = 5;
          }}
        >
          <AddFieldButton
            {...this.props}
            addColumn={this.onAddField.bind(this)}
            displace={displace}
            buttonRef={(c) => {
              this.addFieldNode = c;
            }}
          />
        </span>
        {this.renderRemoveField()}
      </span>
    );
  }

  render() {
    const showTypes =
      this.element.currentKey !== '_id' || this.props.context.path.length;
    const showInput =
      this.element.currentType !== 'Object' &&
      this.element.currentType !== 'Array' &&
      this.element.isValueEditable();
    const showExpand =
      this.element.currentType === 'Object' ||
      this.element.currentType === 'Array';

    return (
      <div className={BEM_BASE}>
        {this.renderFieldName()}
        {this.renderInput(showInput)}
        {this.renderTypes(showTypes)}
        {this.renderActions(showTypes, showInput, showExpand)}
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
  columnApi: PropTypes.any,
  context: PropTypes.any,
  addColumn: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
  removeColumn: PropTypes.func.isRequired,
  renameColumn: PropTypes.func.isRequired,
  elementAdded: PropTypes.func.isRequired,
  elementRemoved: PropTypes.func.isRequired,
  elementTypeChanged: PropTypes.func.isRequired,
  elementMarkRemoved: PropTypes.func.isRequired,
  drillDown: PropTypes.func.isRequired,
  eGridCell: PropTypes.any,
  tz: PropTypes.string.isRequired,
};

CellEditor.displayName = 'CellEditor';

export default CellEditor;
