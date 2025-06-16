import React from 'react';
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
  gap: spacing[100],
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
const CellRenderer: React.FC<CellRendererProps> = ({
  value,
  context,
  column,
  node,
  parentType,
  elementAdded,
  elementRemoved,
  elementTypeChanged,
  drillDown,
  api,
  darkMode,
}) => {
  const element = value as Element;

  const isEmpty = element === undefined || element === null;
  const [isDeleted, setIsDeleted] = React.useState(false);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const isEditable = React.useMemo(() => {
    /* Can't get the editable() function from here, so have to reevaluate */
    let editable = true;
    if (context.path.length > 0 && column.getColId() !== '$_id') {
      const parent = node.data.hadronDocument.getChild(context.path);
      if (!parent || (parentType && parent.currentType !== parentType)) {
        editable = false;
      } else if (parent.currentType === 'Array') {
        let maxKey = 0;
        if (parent.elements.lastElement) {
          maxKey = +parent.elements.lastElement.currentKey + 1;
        }
        if (+column.getColId() > maxKey) {
          editable = false;
        }
      }
    }
    return editable;
  }, [context.path, column, node.data.hadronDocument, parentType]);

  const handleElementEvent = React.useCallback(() => {
    forceUpdate();
  }, []);

  // Subscribe to element events
  React.useEffect(() => {
    if (!isEmpty && element) {
      element.on(Element.Events.Added, handleElementEvent);
      element.on(Element.Events.Converted, handleElementEvent);
      element.on(Element.Events.Edited, handleElementEvent);
      element.on(Element.Events.Reverted, handleElementEvent);

      return () => {
        element.removeListener(Element.Events.Added, handleElementEvent);
        element.removeListener(Element.Events.Converted, handleElementEvent);
        element.removeListener(Element.Events.Edited, handleElementEvent);
        element.removeListener(Element.Events.Reverted, handleElementEvent);
      };
    }
  }, [isEmpty, element, handleElementEvent]);

  const handleUndo = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      const oid: string = node.data.hadronDocument.getStringId();
      if (element.isAdded()) {
        setIsDeleted(true);
        const isArray =
          !element.parent?.isRoot() && element.parent?.currentType === 'Array';
        elementRemoved(String(element.currentKey), oid, isArray);
      } else if (element.isRemoved()) {
        elementAdded(String(element.currentKey), element.currentType, oid);
      } else {
        elementTypeChanged(String(element.currentKey), element.type, oid);
      }
      element.revert();
    },
    [
      element,
      node.data.hadronDocument,
      elementRemoved,
      elementAdded,
      elementTypeChanged,
    ]
  );

  const handleDrillDown = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      drillDown(node.data.hadronDocument, element);
    },
    [drillDown, node.data.hadronDocument, element]
  );

  const handleClicked = React.useCallback(() => {
    if (node.data.state === 'editing') {
      api.startEditingCell({
        rowIndex: node.rowIndex,
        colKey: column.getColId(),
      });
    }
  }, [node, api, column]);

  const renderInvalidCell = React.useCallback(() => {
    let valueClass = `${VALUE_CLASS}-is-${element.currentType.toLowerCase()}`;
    valueClass = `${valueClass} ${INVALID_VALUE}`;

    return <div className={valueClass}>{element.currentValue}</div>;
  }, [element]);

  const getLength = React.useCallback((): number | undefined => {
    if (element.currentType === 'Object') {
      return Object.keys(element.generateObject() as object).length;
    }
    if (element.currentType === 'Array' && element.elements) {
      return element.elements.size;
    }
  }, [element]);

  const renderValidCell = React.useCallback(() => {
    let className = VALUE_BASE;
    let elementContent: string | JSX.Element = '';
    if (element.isAdded()) {
      className = `${className} ${VALUE_BASE}-${ADDED}`;
    } else if (element.isEdited()) {
      className = `${className} ${VALUE_BASE}-${EDITED}`;
    }

    if (element.currentType === 'Object') {
      elementContent = `{} ${getLength() as number} fields`;
    } else if (element.currentType === 'Array') {
      elementContent = `[] ${getLength() as number} elements`;
    } else {
      elementContent = (
        //@ts-expect-error Types for this are currently not consistent
        <BSONValue type={element.currentType} value={element.currentValue} />
      );
    }

    return (
      <div className={className}>
        <div className={cellContainerStyle}>
          {element.decrypted && (
            <span
              data-testid="hadron-document-element-decrypted-icon"
              title="Encrypted Field"
              className={decrypdedIconStyles}
            >
              <Icon glyph="Key" size="small" />
            </span>
          )}
          {elementContent}
        </div>
      </div>
    );
  }, [element, getLength]);

  const renderUndo = React.useCallback(
    (canUndo: boolean, canExpand: boolean) => {
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
          aria-label="Undo"
          onClick={handleUndo}
        >
          <Icon glyph="Undo"></Icon>
        </IconButton>
      );
    },
    [handleUndo]
  );

  const renderExpand = React.useCallback(
    (canExpand: boolean) => {
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
            onClick={handleDrillDown}
          >
            <Icon glyph="OpenNewTab" size="xsmall" />
          </IconButton>
        </span>
      );
    },
    [handleDrillDown]
  );

  // Render logic
  let elementToRender;
  let className = BEM_BASE;
  let canUndo = false;
  let canExpand = false;

  if (!isEditable) {
    elementToRender = '';
    className = `${className}-${UNEDITABLE}`;
  } else if (isEmpty || isDeleted) {
    elementToRender = 'No field';
    className = `${className}-${EMPTY}`;
  } else if (!element.isCurrentTypeValid()) {
    elementToRender = renderInvalidCell();
    className = `${className}-${INVALID}`;
    canUndo = true;
  } else if (element.isRemoved()) {
    elementToRender = 'Deleted field';
    className = `${className}-${DELETED}`;
    canUndo = true;
  } else {
    elementToRender = renderValidCell();
    if (element.isAdded()) {
      className = `${className}-${ADDED}`;
      canUndo = true;
    } else if (element.isModified()) {
      className = `${className}-${EDITED}`;
      canUndo = true;
    }
    canExpand =
      element.currentType === 'Object' || element.currentType === 'Array';
  }

  return (
    // `ag-grid` renders this component outside of the context chain
    // so we re-supply the dark mode theme here.
    <LeafyGreenProvider darkMode={darkMode}>
      <div>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus*/}
        <div className={className} onClick={handleClicked} role="button">
          {renderUndo(canUndo, canExpand)}
          {renderExpand(canExpand)}
          {elementToRender}
        </div>
      </div>
    </LeafyGreenProvider>
  );
};

export default withDarkMode(CellRenderer);
