import React from 'react';
import PropTypes from 'prop-types';
import {
  BSONValue,
  css,
  Icon,
  IconButton,
  LeafyGreenProvider,
  spacing,
  withDarkMode,
} from '@mongodb-js/compass-components';
import { Element } from 'hadron-document';
import type { ICellRendererReactComp } from 'ag-grid-react';
import type { ICellRendererParams } from 'ag-grid-community';
import type { GridActions, TableHeaderType } from '../../stores/grid-store';
import type { CrudActions } from '../../stores/crud-store';
import type { GridContext } from './document-table-view';

/**
 * The BEM base style name for the cell.
 */
const BEM_BASE = 'table-view-cell';

/**
 * The BEM base style name for the value.
 */
const VALUE_BASE = 'editable-element';

/**
 * The document value class.
 */
const VALUE_CLASS = 'editable-element-value';

/**
 * Invalid value class.
 */
const INVALID_VALUE = `${VALUE_CLASS}-is-invalid-type`;

/**
 * The added constant.
 */
const ADDED = 'is-added';

/**
 * The edited constant.
 */
const EDITED = 'is-edited';

/**
 * The empty constant.
 */
const EMPTY = 'is-empty';

/**
 * The uneditable constant.
 */
const UNEDITABLE = 'is-uneditable';

/**
 * The invalid constant.
 */
const INVALID = 'is-invalid';

/**
 * The deleted constant.
 */
const DELETED = 'is-deleted';
/**
 * The button button.
 */
const BUTTON_CLASS = 'table-view-cell-circle-button';

const cellContainerStyle = css({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  gap: spacing[1],
});

const decrypdedIconStyles = css({
  display: 'flex',
});

export type CellRendererProps = Omit<ICellRendererParams, 'context'> & {
  context: GridContext;
  parentType: TableHeaderType;
  elementAdded: GridActions['elementAdded'];
  elementRemoved: GridActions['elementRemoved'];
  elementTypeChanged: GridActions['elementTypeChanged'];
  drillDown: CrudActions['drillDown'];
  tz: string;
  darkMode?: boolean;
};

/**
 * The custom cell renderer that renders a cell in the table view.
 */
class CellRenderer
  extends React.Component<CellRendererProps>
  implements ICellRendererReactComp
{
  element: Element;
  isEmpty: boolean;
  isDeleted: boolean;
  editable: boolean;

  constructor(props: CellRendererProps) {
    super(props);

    this.isEmpty = props.value === undefined || props.value === null;
    this.isDeleted = false;
    this.element = props.value;

    /* Can't get the editable() function from here, so have to reevaluate */
    this.editable = true;
    if (props.context.path.length > 0 && props.column.getColId() !== '$_id') {
      const parent = props.node.data.hadronDocument.getChild(
        props.context.path
      );
      if (
        !parent ||
        (props.parentType && parent.currentType !== props.parentType)
      ) {
        this.editable = false;
      } else if (parent.currentType === 'Array') {
        let maxKey = 0;
        if (parent.elements.lastElement) {
          maxKey = +parent.elements.lastElement.currentKey + 1;
        }
        if (+props.column.getColId() > maxKey) {
          this.editable = false;
        }
      }
    }
  }

  componentDidMount() {
    if (!this.isEmpty) {
      this.subscribeElementEvents();
    }
  }

  componentWillUnmount() {
    if (!this.isEmpty) {
      this.unsubscribeElementEvents();
    }
  }

  subscribeElementEvents() {
    this.element.on(Element.Events.Added, this.handleElementEvent);
    this.element.on(Element.Events.Converted, this.handleElementEvent);
    this.element.on(Element.Events.Edited, this.handleElementEvent);
    this.element.on(Element.Events.Reverted, this.handleElementEvent);
  }

  unsubscribeElementEvents() {
    this.element.removeListener(Element.Events.Added, this.handleElementEvent);
    this.element.removeListener(
      Element.Events.Converted,
      this.handleElementEvent
    );
    this.element.removeListener(Element.Events.Edited, this.handleElementEvent);
    this.element.removeListener(
      Element.Events.Reverted,
      this.handleElementEvent
    );
  }

  handleElementEvent = () => {
    this.forceUpdate();
  };

  handleUndo = (event: React.MouseEvent) => {
    event.stopPropagation();
    const oid = this.props.node.data.hadronDocument.getStringId();
    if (this.element.isAdded()) {
      this.isDeleted = true;
      const isArray =
        !this.element.parent?.isRoot() &&
        this.element.parent?.currentType === 'Array';
      this.props.elementRemoved(String(this.element.currentKey), oid, isArray);
    } else if (this.element.isRemoved()) {
      this.props.elementAdded(
        String(this.element.currentKey),
        this.element.currentType,
        oid
      );
    } else {
      this.props.elementTypeChanged(
        String(this.element.currentKey),
        this.element.type,
        oid
      );
    }
    this.element.revert();
  };

  handleDrillDown(event: React.MouseEvent) {
    event.stopPropagation();
    this.props.drillDown(this.props.node.data.hadronDocument, this.element);
  }

  handleClicked() {
    if (this.props.node.data.state === 'editing') {
      this.props.api.startEditingCell({
        rowIndex: this.props.node.rowIndex,
        colKey: this.props.column.getColId(),
      });
    }
  }

  refresh() {
    return true;
  }

  renderInvalidCell() {
    let valueClass = `${VALUE_CLASS}-is-${this.element.currentType.toLowerCase()}`;
    valueClass = `${valueClass} ${INVALID_VALUE}`;

    /* Return internal div because invalid cells should only hightlight text? */

    return <div className={valueClass}>{this.element.currentValue}</div>;
  }

  getLength(): number | undefined {
    if (this.element.currentType === 'Object') {
      return Object.keys(this.element.generateObject() as object).length;
    }
    if (this.element.currentType === 'Array') {
      return this.element.elements!.size;
    }
  }

  renderValidCell() {
    let className = VALUE_BASE;
    let element: string | JSX.Element = '';
    if (this.element.isAdded()) {
      className = `${className} ${VALUE_BASE}-${ADDED}`;
    } else if (this.element.isEdited()) {
      className = `${className} ${VALUE_BASE}-${EDITED}`;
    }

    if (this.element.currentType === 'Object') {
      element = `{} ${this.getLength() as number} fields`;
    } else if (this.element.currentType === 'Array') {
      element = `[] ${this.getLength() as number} elements`;
    } else {
      element = (
        <BSONValue
          type={this.props.value.currentType}
          value={this.props.value.currentValue}
        />
      );
    }

    return (
      <div className={className}>
        <div className={cellContainerStyle}>
          {this.props.value.decrypted && (
            <span
              data-testid="hadron-document-element-decrypted-icon"
              title="Encrypted Field"
              className={decrypdedIconStyles}
            >
              <Icon glyph="Key" size="small" />
            </span>
          )}
          {element}
        </div>
      </div>
    );
  }

  renderUndo(canUndo: boolean, canExpand: boolean) {
    let undoButtonClass = `${BUTTON_CLASS} ${BUTTON_CLASS}-undo`;
    if (canUndo && canExpand) {
      undoButtonClass = `${undoButtonClass} ${BUTTON_CLASS}-left`;
    }

    if (!canUndo) {
      return null;
    }
    return (
      <IconButton
        className={undoButtonClass}
        // @ts-expect-error TODO: size="small" is not an acceptable size
        size="small"
        aria-label="Expand"
        onClick={this.handleUndo.bind(this)}
      >
        <Icon glyph="Undo"></Icon>
      </IconButton>
    );
  }

  renderExpand(canExpand: boolean) {
    if (!canExpand) {
      return null;
    }
    return (
      <span>
        <IconButton
          className={BUTTON_CLASS}
          // @ts-expect-error TODO: size="small" is not an acceptable size
          size="small"
          aria-label="Expand"
          onClick={this.handleDrillDown.bind(this)}
        >
          <Icon glyph="OpenNewTab" size="xsmall" />
        </IconButton>
      </span>
    );
  }

  render() {
    let element;
    let className = BEM_BASE;
    let canUndo = false;
    let canExpand = false;

    if (!this.editable) {
      element = '';
      className = `${className}-${UNEDITABLE}`;
    } else if (this.isEmpty || this.isDeleted) {
      element = 'No field';
      className = `${className}-${EMPTY}`;
    } else if (!this.element.isCurrentTypeValid()) {
      element = this.renderInvalidCell();
      className = `${className}-${INVALID}`;
      canUndo = true;
    } else if (this.element.isRemoved()) {
      element = 'Deleted field';
      className = `${className}-${DELETED}`;
      canUndo = true;
    } else {
      element = this.renderValidCell();
      if (this.element.isAdded()) {
        className = `${className}-${ADDED}`;
        canUndo = true;
      } else if (this.element.isModified()) {
        className = `${className}-${EDITED}`;
        canUndo = true;
      }
      canExpand =
        this.element.currentType === 'Object' ||
        this.element.currentType === 'Array';
    }

    return (
      // `ag-grid` renders this component outside of the context chain
      // so we re-supply the dark mode theme here.
      <LeafyGreenProvider darkMode={this.props.darkMode}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus*/}
        <div
          className={className}
          onClick={this.handleClicked.bind(this)}
          role="button"
        >
          {this.renderUndo(canUndo, canExpand)}
          {this.renderExpand(canExpand)}
          {element}
        </div>
      </LeafyGreenProvider>
    );
  }

  static propTypes = {
    api: PropTypes.any,
    value: PropTypes.any,
    node: PropTypes.any,
    column: PropTypes.any,
    context: PropTypes.any,
    parentType: PropTypes.any.isRequired,
    elementAdded: PropTypes.func.isRequired,
    elementRemoved: PropTypes.func.isRequired,
    elementTypeChanged: PropTypes.func.isRequired,
    drillDown: PropTypes.func.isRequired,
    tz: PropTypes.string.isRequired,
    darkMode: PropTypes.bool,
  };

  static displayName = 'CellRenderer';
}

export default withDarkMode(CellRenderer);
