import React from 'react';
import PropTypes from 'prop-types';
import {
  BSONValue,
  Button,
  Icon,
  Menu,
  MenuItem,
} from '@mongodb-js/compass-components';
import type { CellEditorProps } from './cell-editor';
import type Document from 'hadron-document';
import type { Element } from 'hadron-document';

/**
 * The default text.
 */
const DEFAULT_TEXT = 'Add field after ';

/**
 * Object text.
 */
const OBJECT_TEXT = 'Add field to ';

/**
 * Array text.
 */
const ARRAY_TEXT = 'Add array element to ';

/**
 * Array element text.
 */
const ARRAY_ELEMENT_TEXT = 'Add array element after ';

/**
 * Add child icon.
 */
const ADD_CHILD_ICON = 'Relationship';

/**
 * Add field icon.
 */
const ADD_FIELD_ICON = 'PlusWithCircle';

export type AddFieldButtonProps = Pick<
  CellEditorProps,
  | 'value'
  | 'addColumn'
  | 'node'
  | 'context'
  | 'column'
  | 'columnApi'
  | 'drillDown'
> & {
  displace: number;
};

type AddFieldButtonState = {
  menu: boolean;
};

/**
 * Add field button component.
 */
class AddFieldButton extends React.Component<
  AddFieldButtonProps,
  AddFieldButtonState
> {
  empty?: boolean;

  /**
   * Instantiate the add field button component.
   *
   * @param {Object} props - The props.
   */
  constructor(props: AddFieldButtonProps) {
    super(props);
    this.state = { menu: false };

    if (props.value === undefined) {
      this.empty = true;
    }
  }

  handleAddFieldClick() {
    const document = this.props.node.data.hadronDocument;
    let parent: Document | Element = this.props.node.data.hadronDocument;
    let editOnly = false;

    // By default and for top-level fields the path is empty.
    // Once the user drills down, the path changes.
    // If the user clicks on the breadcrumb component, then the path also
    // changes.
    if (this.props.context.path.length) {
      parent = document.getChild(this.props.context.path)!;
    }

    const isArray = !parent.isRoot() && parent.currentType === 'Array';
    let newElement: Element;

    if (!this.empty) {
      /* Set key to $new even though for arrays, it will be a index */
      newElement = parent.insertAfter(this.props.value, '$new', '')!;
    } else {
      newElement = parent.insertEnd('$new', '');
    }

    if (isArray) {
      const lastIndex = parent.elements?.lastElement?.currentKey;
      if (this.props.columnApi.getColumn(lastIndex) !== null) {
        editOnly = true;
      }
    }

    this.props.addColumn(
      String(newElement.currentKey),
      String(this.props.column.getColDef().colId),
      this.props.node.childIndex,
      this.props.context.path,
      isArray,
      editOnly,
      this.props.node.data.hadronDocument.getStringId() as string
    );
  }

  /**
   * When clicking on an expandable element to append a child.
   */
  handleAddChildClick() {
    const newElement = this.props.value.insertEnd('$new', '');

    const edit = {
      colId: newElement.currentKey,
      rowIndex: this.props.node.childIndex,
    };

    this.props.drillDown(
      this.props.node.data.hadronDocument,
      this.props.value,
      edit
    );
  }

  /**
   * Is the current element an object?
   *
   * @returns {Boolean} If the element is an object.
   */
  isElementObject() {
    return !this.empty && this.props.value.currentType === 'Object';
  }

  /**
   * Is the current element an array?
   *
   * @returns {Boolean} If the element is an array.
   */
  isElementArray() {
    return !this.empty && this.props.value.currentType === 'Array';
  }

  /**
   * Is the parent of this element an array?
   *
   * @returns {Boolean} If the parent element is an array.
   */
  isParentArray() {
    if (this.props.context.path.length) {
      const parent = this.props.node.data.hadronDocument.getChild(
        this.props.context.path
      );
      return parent?.currentType === 'Array';
    }
    return false;
  }

  /**
   * Render an array menu item.
   *
   * @returns {React.Component} The component.
   */
  renderArrayItem() {
    if (this.isElementArray() && this.props.value.isValueEditable()) {
      return this.renderMenuItem(
        ADD_CHILD_ICON,
        ARRAY_TEXT,
        this.handleAddChildClick.bind(this),
        'add-element-to-array'
      );
    }
  }

  /**
   * Render the default menu item.
   *
   * @returns {React.Component} The component.
   */
  renderDefaultItem() {
    const text = this.isParentArray() ? ARRAY_ELEMENT_TEXT : DEFAULT_TEXT;
    return this.renderMenuItem(
      ADD_FIELD_ICON,
      text,
      this.handleAddFieldClick.bind(this),
      'add-field-after'
    );
  }

  /**
   * Render the value of the element.
   *
   * @returns {React.Component} The value component.
   */
  renderValue() {
    if (this.empty) {
      return null;
    }
    return (
      <BSONValue
        type={this.props.value.currentType}
        value={this.props.value.currentValue}
      />
    );
  }

  /**
   * Render the identifier in the menu. For objects and arrays in an array,
   * this is the type, because the type is already part of the message. For other
   * values inside arrays, it's the actual value. Otherwise it's the key.
   *
   * @returns {String} The field name or value if an array element.
   */
  renderIdentifier() {
    if (this.empty) {
      return this.props.column.getColDef().headerName;
    }
    // this case is already handled in renderDefaultItem()
    if (
      this.isParentArray() &&
      (this.isElementObject() || this.isElementArray())
    ) {
      return this.props.value.currentType;
    }
    return this.props.value.currentKey || this.renderValue();
  }

  /**
   * Render a single menu item.
   *
   * @param {String} glyph - The icon class name.
   * @param {String} text - The text.
   * @param {Function} handler - The click handler.
   * @param {String} testId - The test id.
   *
   * @returns {Component} the menu item component
   */
  renderMenuItem(
    glyph: string,
    text: string,
    handler: React.MouseEventHandler,
    testId: string
  ) {
    return (
      <MenuItem
        data-testid={testId}
        onClick={handler}
        glyph={glyph ? <Icon glyph={glyph} /> : undefined}
      >
        {text} <b>{this.renderIdentifier()}</b>
      </MenuItem>
    );
  }

  /**
   * Render an object menu item.
   *
   * @returns {React.Component} The component.
   */
  renderObjectItem() {
    if (this.isElementObject() && this.props.value.isValueEditable()) {
      return this.renderMenuItem(
        ADD_CHILD_ICON,
        OBJECT_TEXT,
        this.handleAddChildClick.bind(this),
        'add-child-to-object'
      );
    }
  }

  /**
   * Render the menu.
   *
   * @returns {React.Component} The menu.
   */
  renderMenu() {
    return (
      <>
        {this.renderObjectItem()}
        {this.renderArrayItem()}
        {this.renderDefaultItem()}
      </>
    );
  }

  /**
   * Render the Add field button.
   *
   * @returns {React.Component} The component.
   */
  render() {
    if (this.empty && this.isParentArray()) {
      return null;
    }

    return (
      <Menu
        usePortal={false}
        align="bottom"
        justify="start"
        trigger={({
          children,
          onClick,
          ...props
        }: {
          children: JSX.Element;
          onClick: React.MouseEventHandler;
        }) => {
          return (
            <Button
              size="xsmall"
              data-testid="table-view-cell-editor-add-field-button"
              onClick={onClick}
              {...props}
            >
              <Icon glyph="Plus" size="xsmall"></Icon>
              {children}
            </Button>
          );
        }}
      >
        {this.renderMenu()}
      </Menu>
    );
  }

  static displayName = 'AddFieldButton';

  static propTypes = {
    value: PropTypes.object,
    displace: PropTypes.number.isRequired,
    columnApi: PropTypes.any.isRequired,
    api: PropTypes.any.isRequired,
    context: PropTypes.any.isRequired,
    column: PropTypes.any.isRequired,
    node: PropTypes.any.isRequired,
    addColumn: PropTypes.func.isRequired,
    drillDown: PropTypes.func.isRequired,
  };
}

export default AddFieldButton;
