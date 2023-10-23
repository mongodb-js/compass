import React from 'react';
import PropTypes from 'prop-types';
import type { TypeCastTypes } from 'hadron-type-checker';
import type { Editor, Element } from 'hadron-document';
import type Document from 'hadron-document';
import {
  ElementEditor as initEditors,
  getDefaultValueForType,
} from 'hadron-document';
import TypesDropdown from './types-dropdown';
import AddFieldButton from './add-field-button';
import {
  Button,
  css,
  cx,
  Icon,
  LeafyGreenProvider,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import type {
  ColumnApi,
  GridApi,
  ICellEditorParams,
  RowNode,
} from 'ag-grid-community';
import type { ICellEditorReactComp } from 'ag-grid-react';
import type { GridActions, TableHeaderType } from '../../stores/grid-store';
import type { CrudActions } from '../../stores/crud-store';
import type { GridContext } from './document-table-view';

/**
 * BEM BASE
 */
const BEM_BASE = 'table-view-cell-editor';

/**
 * The document value class.
 */
const VALUE_CLASS = 'editable-element-value';

const textInputStyle = css({
  width: spacing[6] * 2,
  marginRight: spacing[1],
});

const actionsStyle = css({
  marginLeft: spacing[1],
  display: 'flex',
  gap: spacing[1] / 2,
});

export interface DocumentTableRowNode extends RowNode {
  data: {
    hadronDocument: Document;
    state: 'editing' | 'deleting' | undefined;
    isFooter?: boolean;
    hasFooter?: boolean;
    rowNumber: number;
  };
}

export type CellEditorProps = Omit<ICellEditorParams, 'node' | 'context'> & {
  value: Element;
  node: DocumentTableRowNode;
  api: GridApi;
  columnApi: ColumnApi;
  context: GridContext;
  addColumn: GridActions['addColumn'];
  removeColumn: GridActions['removeColumn'];
  renameColumn: GridActions['renameColumn'];
  elementAdded: GridActions['elementAdded'];
  elementRemoved: GridActions['elementRemoved'];
  elementTypeChanged: GridActions['elementTypeChanged'];
  elementMarkRemoved: GridActions['elementMarkRemoved'];
  drillDown: CrudActions['drillDown'];
  tz: string;
  darkMode?: boolean;
};

type CellEditorState = {
  fieldName: string;
};

/**
 * The custom cell editor for the table view.
 */
class CellEditor
  extends React.Component<CellEditorProps, CellEditorState>
  implements ICellEditorReactComp
{
  element: Element | undefined;
  changed = false;
  wasEmpty = false;
  newField = false;
  oldType?: TypeCastTypes;
  _editors?: ReturnType<typeof initEditors>;
  _pasting?: boolean;

  constructor(props: CellEditorProps) {
    super(props);
    this.state = { fieldName: '' };

    /* If the editor is opened and there was no field defined
       in this cell, get the type of the column from props.column and add a
       field to the HadronDocument that is empty. */
    const { node, context, column, value } = props;
    this.element = value;
    this.wasEmpty = false;
    this.newField = false;

    let parent: Document | Element = node.data.hadronDocument;
    if (context.path.length) {
      parent = parent.getChild(context.path)!;
    }

    /* If expanding an empty element */
    if (
      this.element === undefined &&
      column.getColDef().headerName === '$new'
    ) {
      this.wasEmpty = true;

      this.element = parent.insertEnd('$new', '');
      this.newField = true;
    } else if (this.element === undefined) {
      /* field was empty */
      this.wasEmpty = true;
      /* If the column is of one type, then make the new value that type.
         Otherwise, set it to undefined. Set the key name to be the columnId */
      const key = column.getColDef().headerName;
      let type: TableHeaderType =
        column.getColDef().headerComponentParams.bsonType;
      if (type === 'Mixed') {
        type = 'String';
      }

      const value = getDefaultValueForType(type);
      this.element = parent.insertEnd(String(key), value);
      this.element.edit(value);
    } else {
      /* Only use fieldName if this a newly added field */
      if (this.element.currentKey !== '$new') {
        this.setState({ fieldName: String(this.element.currentKey) });
      }
      /* If this column has just been added */
      this.newField = value.currentKey === '$new';
    }

    this.oldType = this.element.currentType;
    this._editors = initEditors(this.element /*, props.tz*/);
    this.editor().start();
  }

  componentDidMount() {
    if (this.props.eGridCell) {
      this.props.eGridCell.addEventListener('keydown', this.onKeyDown);
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
  onKeyDown = (event: KeyboardEvent) => {
    /* eslint complexity: 0 */
    event.stopPropagation();
    if (event.keyCode === 27 || event.keyCode === 13) {
      this.props.api.stopEditing();
    }
  };

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
  isCancelAfterEnd(): boolean {
    this.editor().complete();
    const id = this.props.node.data.hadronDocument.getStringId() as string;
    const element = this.element as Element;

    /* If this is a new field, need to update the colDef with the key name */
    if (this.newField) {
      const key = this.state.fieldName;
      const path = [...this.props.context.path, key];

      /* Cancel and remove the column if the key was unedited or a duplicate */
      // TODO: Applies to objects, not arrays.
      if (key === '' || this.isDuplicateKey(key)) {
        element.revert();
        this.props.removeColumn('$new');
        return false;
      }

      /* Rename the element within HadronDocument */
      this.props.renameColumn(String(element.currentKey), key);
      element.rename(key);

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
        element.revert();
        return false;
      }
    } else if (
      !element.isAdded() &&
      !element.isRemoved() &&
      element.currentType !== this.oldType
    ) {
      /* Update the grid store since the element has changed type */
      this.props.elementTypeChanged(
        String(element.currentKey),
        element.currentType,
        id
      );
    }
    if (!element.isRemoved() && element.isAdded()) {
      /* Update the grid store so we know what type this element is */
      this.props.elementAdded(
        String(element.currentKey),
        element.currentType,
        id
      );
      /* TODO: should we update column.* as well to be safe?
        Not needed if everywhere we access columns through .getColDef() but
        if somewhere internally they don't do that, will have outdated values.
        Docs: https://www.ag-grid.com/javascript-grid-column-definitions
       */
    }
    this.props.api.refreshCells({
      rowNodes: [this.props.node as RowNode],
      force: true,
    });
    return false;
  }

  handleTypeChange() {
    /* If we've casted to object or array, need to get rid of any placeholders */
    const type = this.element?.currentType;
    if (type !== this.oldType) {
      this.changed = true;
      if (type === 'Array' || type === 'Object') {
        for (const element of this.element?.elements ?? []) {
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
    if (this.element?.isRemovable()) {
      const oid = this.props.node.data.hadronDocument.getStringId() as string;

      if (this.wasEmpty) {
        this.element = undefined; // return state to undefined
        return this.props.api.stopEditing();
      }

      if (this.newField || this.element.isAdded()) {
        /* new field not possible */
        const isArray =
          !this.element?.parent?.isRoot() &&
          this.element?.parent?.currentType === 'Array';
        this.props.elementRemoved(
          String(this.element.currentKey),
          oid,
          isArray
        );
      } else {
        this.props.elementMarkRemoved(String(this.element.currentKey), oid);
      }
      this.element.remove();
    }
    this.props.api.stopEditing();
  }

  handleDrillDown() {
    this.changed = true;
    this.props.api.stopEditing();
    this.props.drillDown(this.props.node.data.hadronDocument, this.element!);
  }

  handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.changed = true;
    if (this._pasting) {
      this._pasteEdit(event.target.value);
    } else {
      this.editor().edit(event.target.value);
    }
    this.forceUpdate();
  }

  handleFieldNameChange(event: React.ChangeEvent<HTMLInputElement>) {
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
  _pasteEdit(value: string) {
    try {
      this.editor().paste(value);
    } catch (e) {
      this.editor().edit(value);
    } finally {
      this._pasting = false;
    }
  }

  isDuplicateKey(value: string) {
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
  editor(): Editor {
    return (
      this._editors![this.element!.currentType as keyof typeof this._editors] ??
      this._editors!.Standard
    );
  }

  /**
   * Get the style for the input wrapper.
   *
   * @returns {String} The class name.
   */
  wrapperStyle() {
    return `${VALUE_CLASS}-wrapper ${VALUE_CLASS}-wrapper-is-${String(
      this.element?.currentType.toLowerCase()
    )}`;
  }

  /**
   * Render the field name if the element is being added.
   *
   * @returns {React.Component} The component.
   */
  renderFieldName() {
    if (this.newField && this.element?.currentKey === '$new') {
      return (
        <TextInput
          className={textInputStyle}
          sizeVariant="xsmall"
          data-testid="table-view-cell-editor-fieldname-input"
          value={this.state.fieldName}
          placeholder="Field Name"
          onChange={this.handleFieldNameChange.bind(this)}
          // NOTE: Leafygreen doesn't support aria-label and only understand "aria-labelledby" and "label" instead
          aria-labelledby=""
        />
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
  renderTypes(showTypes: boolean) {
    if (!showTypes) {
      return null;
    }
    return (
      <div
        className={`${BEM_BASE}-input-types`}
        onBlur={this.handleTypeChange.bind(this)}
      >
        <TypesDropdown element={this.element!} />
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
  renderInput(showInput: boolean) {
    if (!showInput) {
      return null;
    }

    return (
      <div>
        <span className={this.wrapperStyle()}>
          <TextInput
            className={textInputStyle}
            data-testid="table-view-cell-editor-value-input"
            sizeVariant="xsmall"
            onChange={this.handleInputChange.bind(this)}
            onPaste={this.handlePaste.bind(this)}
            value={this.editor().value()}
            placeholder="Value"
            aria-labelledby=""
          ></TextInput>
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
  renderExpand(showExpand: boolean) {
    if (!showExpand) {
      return null;
    }
    return (
      <Button
        data-testid="table-view-cell-editor-expand-button"
        size="xsmall"
        onClick={this.handleDrillDown.bind(this)}
      >
        <Icon glyph="OpenNewTab" size="xsmall"></Icon>
      </Button>
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
      (this.element?.currentKey === '_id' && !this.props.context.path.length)
    ) {
      return null;
    }
    return (
      <Button
        data-testid="table-view-cell-editor-remove-field-button"
        size="xsmall"
        onClick={this.handleRemoveField.bind(this)}
      >
        <Icon glyph="Trash" size="xsmall"></Icon>
      </Button>
    );
  }

  onAddField(...args: Parameters<CellEditorProps['addColumn']>) {
    // we have to setTimeout here otherwise there's an untraceable
    // setState on unmounted component error
    setTimeout(() => {
      // we explicitly stop editing first to prevent breaking the UI
      this.props.api.stopEditing();
      this.props.addColumn(...args);
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
  renderActions(showTypes: boolean, showInput: boolean, showExpand: boolean) {
    if (this.element?.currentKey === '$new') {
      return null;
    }

    const displace = 87 * +showTypes + 130 * +showInput + 23 * +showExpand;
    return (
      <span className={cx(`${BEM_BASE}-actions`, actionsStyle)}>
        {this.renderExpand(showExpand)}
        <span>
          <AddFieldButton
            {...this.props}
            addColumn={this.onAddField.bind(this)}
            displace={displace}
          />
        </span>
        {this.renderRemoveField()}
      </span>
    );
  }

  render() {
    const showTypes =
      this.element?.currentKey !== '_id' || this.props.context.path.length;
    const showInput =
      this.element?.currentType !== 'Object' &&
      this.element?.currentType !== 'Array' &&
      this.element?.isValueEditable();
    const showExpand =
      this.element?.currentType === 'Object' ||
      this.element?.currentType === 'Array';

    return (
      // `ag-grid` renders this component outside of the context chain
      // so we re-supply the dark mode theme here.
      <LeafyGreenProvider darkMode={this.props.darkMode}>
        <div className={BEM_BASE}>
          {this.renderFieldName()}
          {this.renderInput(!!showInput)}
          {this.renderTypes(!!showTypes)}
          {this.renderActions(!!showTypes, !!showInput, !!showExpand)}
        </div>
      </LeafyGreenProvider>
    );
  }

  static propTypes = {
    value: PropTypes.any,
    column: PropTypes.any,
    node: PropTypes.any,
    api: PropTypes.any,
    columnApi: PropTypes.any,
    context: PropTypes.any,
    addColumn: PropTypes.func.isRequired,
    removeColumn: PropTypes.func.isRequired,
    renameColumn: PropTypes.func.isRequired,
    elementAdded: PropTypes.func.isRequired,
    elementRemoved: PropTypes.func.isRequired,
    elementTypeChanged: PropTypes.func.isRequired,
    elementMarkRemoved: PropTypes.func.isRequired,
    drillDown: PropTypes.func.isRequired,
    eGridCell: PropTypes.any,
    tz: PropTypes.string.isRequired,
    darkMode: PropTypes.bool,
  };

  static displayName = 'CellEditor';
}

export default CellEditor;
