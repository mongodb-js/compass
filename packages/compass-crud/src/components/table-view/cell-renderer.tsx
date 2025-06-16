import React, {
  useMemo,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from 'react';
import {
  BSONValue,
  css,
  Icon,
  IconButton,
  LeafyGreenProvider,
  spacing,
  withDarkMode,
} from '@mongodb-js/compass-components';
import { type Document, Element } from 'hadron-document';
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
 * The valid constant.
 */
const VALID = 'valid';

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

interface CellContentProps {
  element: Element | undefined | null;
  cellState:
    | typeof UNEDITABLE
    | typeof EMPTY
    | typeof INVALID
    | typeof DELETED
    | typeof ADDED
    | typeof EDITED
    | typeof VALID;
  onUndo: (event: React.MouseEvent) => void;
  onExpand: (event: React.MouseEvent) => void;
}

const CellContent: React.FC<CellContentProps> = ({
  element,
  cellState,
  onUndo,
  onExpand,
}) => {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const isEmpty = element === undefined || element === null;
  const handleElementEvent = useCallback(() => {
    forceUpdate();
  }, []);

  // Subscribe to element events
  useEffect(() => {
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

  const elementLength = useMemo((): number | undefined => {
    if (!element) {
      return undefined;
    }

    if (element.currentType === 'Object') {
      return Object.keys(element.generateObject() as object).length;
    }
    if (element.currentType === 'Array' && element.elements) {
      return element.elements.size;
    }
  }, [element]);

  const renderContent = useCallback(() => {
    if (cellState === EMPTY || !element) {
      return 'No field';
    }

    if (cellState === UNEDITABLE) {
      return '';
    }

    if (cellState === DELETED) {
      return 'Deleted field';
    }

    if (cellState === INVALID) {
      let valueClass = `${VALUE_CLASS}-is-${element.currentType.toLowerCase()}`;
      valueClass = `${valueClass} ${INVALID_VALUE}`;

      return <div className={valueClass}>{element.currentValue}</div>;
    }

    let className = VALUE_BASE;
    let elementContent: string | JSX.Element = '';
    if (cellState === ADDED || cellState === EDITED) {
      className = `${className} ${VALUE_BASE}-${cellState}`;
    }

    const isArrayOrObject =
      element.currentType === 'Array' || element.currentType === 'Object';

    if (elementLength !== undefined && isArrayOrObject) {
      if (element.currentType === 'Object') {
        elementContent = `{} ${elementLength} fields`;
      } else if (element.currentType === 'Array') {
        elementContent = `[] ${elementLength} elements`;
      }
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
  }, [element, elementLength, cellState]);

  const canUndo =
    cellState === ADDED ||
    cellState === EDITED ||
    cellState === INVALID ||
    cellState === DELETED;

  const canExpand =
    (cellState === VALID || cellState === ADDED || cellState === EDITED) &&
    (element?.currentType === 'Object' || element?.currentType === 'Array');

  return (
    <>
      {canUndo && <CellUndoButton alignLeft={canExpand} onClick={onUndo} />}
      {canExpand && <CellExpandButton onClick={onExpand} />}
      {renderContent()}
    </>
  );
};

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
  const element = value as Element | undefined | null;

  const isEmpty = element === undefined || element === null;
  const [isDeleted, setIsDeleted] = useState(false);

  const isEditable = useMemo(() => {
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

  const handleUndo = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!element) {
        return;
      }
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

  const handleDrillDown = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!element) {
        return;
      }
      drillDown(node.data.hadronDocument as Document, element);
    },
    [drillDown, node.data.hadronDocument, element]
  );

  const handleClicked = useCallback(() => {
    if (node.data.state === 'editing') {
      api.startEditingCell({
        rowIndex: node.rowIndex,
        colKey: column.getColId(),
      });
    }
  }, [node, api, column]);

  // Determine cell state
  let cellState:
    | typeof UNEDITABLE
    | typeof EMPTY
    | typeof INVALID
    | typeof DELETED
    | typeof ADDED
    | typeof EDITED
    | typeof VALID;

  if (!isEditable) {
    cellState = UNEDITABLE;
  } else if (isEmpty || isDeleted) {
    cellState = EMPTY;
  } else if (!element.isCurrentTypeValid()) {
    cellState = INVALID;
  } else if (element.isRemoved()) {
    cellState = DELETED;
  } else if (element.isAdded()) {
    cellState = ADDED;
  } else if (element.isModified()) {
    cellState = EDITED;
  } else {
    cellState = VALID;
  }

  return (
    // `ag-grid` renders this component outside of the context chain
    // so we re-supply the dark mode theme here.
    <LeafyGreenProvider darkMode={darkMode}>
      <div>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus*/}
        <div
          className={
            cellState === VALID ? BEM_BASE : `${BEM_BASE}-${cellState}`
          }
          onClick={handleClicked}
          role="button"
        >
          <CellContent
            element={element}
            cellState={cellState}
            onUndo={handleUndo}
            onExpand={handleDrillDown}
          />
        </div>
      </div>
    </LeafyGreenProvider>
  );
};

export default withDarkMode(CellRenderer);

interface CellUndoButtonProps {
  alignLeft: boolean;
  onClick: (event: React.MouseEvent) => void;
}

const CellUndoButton: React.FC<CellUndoButtonProps> = ({
  alignLeft,
  onClick,
}) => {
  let undoButtonClass = `${BUTTON_CLASS} ${BUTTON_CLASS}-undo`;
  if (alignLeft) {
    undoButtonClass = `${undoButtonClass} ${BUTTON_CLASS}-left`;
  }

  return (
    <IconButton
      className={undoButtonClass}
      // @ts-expect-error TODO: size="small" is not an acceptable size
      size="small"
      aria-label="Undo"
      onClick={onClick}
    >
      <Icon glyph="Undo"></Icon>
    </IconButton>
  );
};

interface CellExpandButtonProps {
  onClick: (event: React.MouseEvent) => void;
}

const CellExpandButton: React.FC<CellExpandButtonProps> = ({ onClick }) => {
  return (
    <IconButton
      className={BUTTON_CLASS}
      // @ts-expect-error TODO: size="small" is not an acceptable size
      size="small"
      aria-label="Expand"
      onClick={onClick}
    >
      <Icon glyph="OpenNewTab" size="xsmall" />
    </IconButton>
  );
};
