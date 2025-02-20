import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  default as HadronDocumentType,
  Element as HadronElementType,
  Editor as EditorType,
} from 'hadron-document';
import {
  ElementEvents,
  ElementEditor,
  DEFAULT_VISIBLE_ELEMENTS,
} from 'hadron-document';
import BSONValue from '../bson-value';
import { spacing } from '@leafygreen-ui/tokens';
import { KeyEditor, ValueEditor, TypeEditor } from './element-editors';
import { EditActions, AddFieldActions } from './element-actions';
import { useAutoFocusContext } from './auto-focus-context';
import { useForceUpdate } from './use-force-update';
import { usePrevious } from './use-previous';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { Icon } from '../leafygreen';
import { useDarkMode } from '../../hooks/use-theme';
import VisibleFieldsToggle from './visible-field-toggle';

function getEditorByType(type: HadronElementType['type']) {
  switch (type) {
    case 'Date':
    case 'String':
    case 'Decimal128':
    case 'Double':
    case 'Int32':
    case 'Int64':
    case 'Null':
    case 'Undefined':
    case 'ObjectId':
      return ElementEditor[`${type}Editor` as const];
    default:
      return ElementEditor.StandardEditor;
  }
}

function useElementEditor(el: HadronElementType) {
  const editor = useRef<EditorType | null>(null);

  if (
    !editor.current ||
    editor.current?.element !== el ||
    editor.current?.type !== el.currentType
  ) {
    const Editor = getEditorByType(el.currentType);
    editor.current = new Editor(el);
  }

  return editor.current;
}

function useHadronElement(el: HadronElementType) {
  const forceUpdate = useForceUpdate();
  const prevEl = usePrevious(el);
  const editor = useElementEditor(el);
  // NB: Duplicate key state is kept local to the component and not derived on
  // every change so that only the changed key is highlighed as duplicate
  const [isDuplicateKey, setIsDuplicateKey] = useState(() => {
    return el.isDuplicateKey(el.currentKey);
  });

  const onElementChanged = useCallback(
    (changedElement: HadronElementType) => {
      if (el.uuid === changedElement.uuid) {
        forceUpdate();
      }
    },
    [el, forceUpdate]
  );

  const onElementAddedOrRemoved = useCallback(
    (
      _el: HadronElementType,
      parentEl: HadronElementType | HadronDocumentType | null
    ) => {
      if (el === parentEl) {
        forceUpdate();
      }
    },
    [el, forceUpdate]
  );

  const onElementReverted = useCallback(
    (changedElement: HadronElementType) => {
      if (el.uuid === changedElement.uuid) {
        // When an element is reverted we check again if the key is a duplicate.
        setIsDuplicateKey(el.isDuplicateKey(el.key));
        forceUpdate();
      }
    },
    [el, forceUpdate]
  );

  useEffect(() => {
    if (prevEl && prevEl !== el) {
      forceUpdate();
    }
  }, [el, prevEl, forceUpdate]);

  useEffect(() => {
    el.on(ElementEvents.Converted, onElementChanged);
    el.on(ElementEvents.Edited, onElementChanged);
    el.on(ElementEvents.Reverted, onElementReverted);
    el.on(ElementEvents.Invalid, onElementChanged);
    el.on(ElementEvents.Valid, onElementChanged);
    el.on(ElementEvents.Added, onElementAddedOrRemoved);
    el.on(ElementEvents.Removed, onElementAddedOrRemoved);
    el.on(ElementEvents.Expanded, onElementChanged);
    el.on(ElementEvents.Collapsed, onElementChanged);
    el.on(ElementEvents.VisibleElementsChanged, onElementChanged);

    return () => {
      el.off(ElementEvents.Converted, onElementChanged);
      el.off(ElementEvents.Edited, onElementChanged);
      el.off(ElementEvents.Reverted, onElementReverted);
      el.off(ElementEvents.Valid, onElementChanged);
      el.off(ElementEvents.Added, onElementAddedOrRemoved);
      el.off(ElementEvents.Removed, onElementAddedOrRemoved);
      el.off(ElementEvents.Expanded, onElementChanged);
      el.off(ElementEvents.Collapsed, onElementChanged);
      el.off(ElementEvents.VisibleElementsChanged, onElementChanged);
    };
  }, [el, onElementChanged, onElementAddedOrRemoved, onElementReverted]);

  const isValid = el.isCurrentTypeValid();

  return {
    id: el.uuid,
    key: {
      value: String(el.currentKey),
      change(newVal: string) {
        setIsDuplicateKey(el.isDuplicateKey(newVal));
        el.rename(newVal);
      },
      // TODO: isKeyEditable should probably account for Array parents on it's
      // own, but right now `isValueEditable` has a weird dependency on it and
      // so marking aray keys uneditable breaks value editing
      editable: el.isKeyEditable() && el.parent?.currentType !== 'Array',
      valid: !isDuplicateKey,
      validationMessage: isDuplicateKey
        ? `Duplicate key "${el.currentKey}" - this will overwrite previous values`
        : null,
    },
    value: {
      value: editor.value(),
      originalValue:
        el.currentType === 'Array' ? [...(el.elements || [])] : el.currentValue,
      change(newVal: string) {
        editor.edit(newVal);
      },
      editable:
        el.isValueEditable() &&
        el.currentType !== 'Object' &&
        el.currentType !== 'Array',
      decrypted: el.isValueDecrypted(),
      valid: isValid,
      validationMessage: !isValid ? el.invalidTypeMessage ?? null : null,
      startEdit: editor.start.bind(editor),
      completeEdit: editor.complete.bind(editor),
    },
    type: {
      value: el.currentType,
      change(newVal: HadronElementType['type']) {
        el.changeType(newVal);
      },
    },
    revert: el.isRevertable() ? el.revert.bind(el) : null,
    remove: el.isNotActionable() ? null : el.remove.bind(el),
    expandable: Boolean(el.elements),
    children: el.elements ? [...el.elements] : [],
    visibleChildren: el.getVisibleElements(),
    level: el.level,
    parentType: el.parent?.currentType,
    removed: el.isRemoved(),
    internal: el.isInternalField(),
    expanded: el.expanded,
    expand: el.expand.bind(el),
    collapse: el.collapse.bind(el),
  };
}
const expandButton = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
  '&:hover': {
    cursor: 'pointer',
  },
  display: 'flex',
});

const hadronElement = css({
  display: 'flex',
  paddingLeft: spacing[50],
  paddingRight: spacing[50],
  marginTop: 1,
});

const hadronElementLightMode = css({
  '&:hover': {
    backgroundColor: palette.gray.light2,
  },
});

const hadronElementDarkMode = css({
  '&:hover': {
    backgroundColor: palette.gray.dark4,
  },
});

const elementInvalidLightMode = css({
  backgroundColor: palette.yellow.light3,
  '&:hover': {
    backgroundColor: palette.yellow.light2,
  },
});

const elementRemovedLightMode = css({
  backgroundColor: palette.red.light3,
  '&:hover': {
    backgroundColor: palette.red.light2,
  },
});

const elementInvalidDarkMode = css({
  backgroundColor: palette.yellow.dark3,
  '&:hover': {
    backgroundColor: palette.yellow.dark2,
  },
});

const elementRemovedDarkMode = css({
  backgroundColor: palette.red.dark3,
  '&:hover': {
    backgroundColor: palette.red.dark2,
  },
});

const elementActions = css({
  flex: 'none',
  width: spacing[300],
  position: 'relative',
});

const elementLineNumber = css({
  flex: 'none',
  position: 'relative',
  marginLeft: spacing[1],
  boxSizing: 'content-box',
});

const addFieldActionsContainer = css({
  position: 'absolute',
  top: 0,
  right: 0,
});

const lineNumberCount = css({
  '&::before': {
    display: 'block',
    width: '100%',
    counterIncrement: 'line-number',
    content: 'counter(line-number)',
    textAlign: 'end',
    color: palette.gray.base,
  },
});

const lineNumberInvalidLightMode = css({
  backgroundColor: palette.yellow.base,
  '&::before': {
    color: palette.yellow.dark2,
  },
});

const lineNumberRemovedLightMode = css({
  backgroundColor: palette.red.base,
  color: palette.red.light3,
  '&::before': {
    color: palette.red.light3,
  },
});

const lineNumberInvalidDarkMode = css({
  backgroundColor: palette.yellow.dark2,
  '&::before': {
    color: palette.yellow.base,
  },
});

const lineNumberRemovedDarkMode = css({
  backgroundColor: palette.red.light3,
  color: palette.red.base,
  '&::before': {
    color: palette.red.base,
  },
});

const elementSpacer = css({
  flex: 'none',
});

const elementExpand = css({
  width: spacing[3],
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
});

const elementKey = css({
  flex: 'none',
  fontWeight: 'bold',
  maxWidth: '60%',
});

const elementKeyInternal = css({
  color: palette.gray.base,
});

const elementDivider = css({
  flex: 'none',
  userSelect: 'none',
});

const elementValue = css({
  flex: 1,
  minWidth: 0,
  maxWidth: '100%',
});

const elementType = css({
  flex: 'none',
  marginLeft: spacing[1],
});

const actions = css({
  display: 'none',
});

const actionsVisible = css({
  // We are deliberately not using useFocus and useHover hooks in the component
  // as these listeners are expensive and so with the amount of code and DOM on
  // the screen causes noticeable frame skips in the browser. This code is a bit
  // brittle as we can't really reference the exact className of an emotion
  // style so we have to rely on data attributes, but the chances that this
  // should ever be an issue are pretty slim
  '[data-document-element="true"]:hover &, [data-document-element="true"]:focus-within &':
    {
      display: 'block',
    },
});

const lineNumberCountHidden = css({
  // See above
  '[data-document-element="true"]:hover &::before, [data-document-element="true"]:focus-within &::before':
    {
      visibility: 'hidden',
    },
});

const elementKeyDarkMode = css({
  color: palette.gray.light2,
});

const calculateElementSpacerWidth = (
  editable: boolean,
  level: number,
  extra: number
) => {
  return (editable ? spacing[100] : 0) + extra + spacing[400] * level;
};

export const calculateShowMoreToggleOffset = ({
  editable,
  level,
  alignWithNestedExpandIcon,
  extraGutterWidth = 0,
}: {
  editable: boolean;
  level: number;
  alignWithNestedExpandIcon: boolean;
  extraGutterWidth: number | undefined;
}) => {
  const spacerWidth = calculateElementSpacerWidth(
    editable,
    level,
    extraGutterWidth
  );
  const editableOffset = editable
    ? // space taken by element actions
      spacing[300] +
      // space and margin taken by line number element
      spacing[400] +
      spacing[100]
    : 0;
  const expandIconSize = alignWithNestedExpandIcon ? spacing[400] : 0;
  return spacerWidth + editableOffset + expandIconSize;
};

export const HadronElement: React.FunctionComponent<{
  value: HadronElementType;
  editable: boolean;
  editingEnabled: boolean;
  onEditStart?: (id: string, field: 'key' | 'value' | 'type') => void;
  lineNumberSize: number;
  onAddElement(el: HadronElementType): void;
  extraGutterWidth?: number;
}> = ({
  value: element,
  editable,
  editingEnabled,
  onEditStart,
  lineNumberSize,
  onAddElement,
  extraGutterWidth = 0,
}) => {
  const darkMode = useDarkMode();
  const autoFocus = useAutoFocusContext();
  const {
    id,
    key,
    value,
    type,
    revert,
    remove,
    expandable,
    children,
    visibleChildren,
    level,
    parentType,
    removed,
    internal,
    expanded,
    expand,
    collapse,
  } = useHadronElement(element);

  const toggleExpanded = () => {
    expanded ? collapse() : expand();
  };

  const lineNumberMinWidth = useMemo(() => {
    // Only account for ~ line count length if we are in editing mode
    if (editingEnabled) {
      const charCount = String(lineNumberSize).length;
      return charCount > 2 ? `${charCount}.5ch` : spacing[3];
    }
    return spacing[400];
  }, [lineNumberSize, editingEnabled]);

  const elementSpacerWidth = useMemo(
    () => calculateElementSpacerWidth(editable, level, extraGutterWidth),
    [editable, level, extraGutterWidth]
  );

  // To render the "Show more" toggle for the nested expandable elements we need
  // to calculate a proper offset so that it aligns with the nesting level
  const nestedElementsVisibilityToggleOffset = useMemo(
    () =>
      calculateShowMoreToggleOffset({
        editable,
        level,
        alignWithNestedExpandIcon: true,
        extraGutterWidth,
      }),
    [editable, level, extraGutterWidth]
  );

  const isValid = key.valid && value.valid;
  const shouldShowActions = editingEnabled;

  const elementRemoved: string = darkMode
    ? elementRemovedDarkMode
    : elementRemovedLightMode;
  const elementInvalid: string = darkMode
    ? elementInvalidDarkMode
    : elementInvalidLightMode;

  const elementProps = {
    className: cx(
      hadronElement,
      darkMode ? hadronElementDarkMode : hadronElementLightMode,
      removed ? elementRemoved : editingEnabled && !isValid && elementInvalid
    ),
    onClick: toggleExpanded,
  };

  const keyProps = {
    className: cx(
      elementKey,
      internal && elementKeyInternal,
      darkMode && elementKeyDarkMode
    ),
  };

  const lineNumberRemoved = darkMode
    ? lineNumberRemovedDarkMode
    : lineNumberRemovedLightMode;
  const lineNumberInvalid = darkMode
    ? lineNumberInvalidDarkMode
    : lineNumberInvalidLightMode;

  const handleVisibleElementsChanged = useCallback(
    (totalVisibleFields: number) => {
      element.setMaxVisibleElementsCount(totalVisibleFields);
    },
    [element]
  );

  return (
    <>
      <div
        data-document-element="true"
        data-testid="hadron-document-element"
        data-field={key.value}
        data-id={element.uuid}
        {...elementProps}
      >
        {editable && (
          <div className={elementActions}>
            <div className={cx(actions, shouldShowActions && actionsVisible)}>
              <EditActions
                onRevert={revert}
                onRemove={remove}
                editing={editingEnabled}
              ></EditActions>
            </div>
          </div>
        )}
        {editable && (
          <div
            className={cx(
              elementLineNumber,
              editingEnabled && lineNumberCount,
              shouldShowActions && lineNumberCountHidden,
              removed
                ? lineNumberRemoved
                : editingEnabled && !isValid && lineNumberInvalid
            )}
            style={{ minWidth: lineNumberMinWidth }}
          >
            <div
              className={cx(
                actions,
                addFieldActionsContainer,
                shouldShowActions && actionsVisible
              )}
            >
              <AddFieldActions
                editing={editingEnabled}
                type={type.value}
                parentType={
                  parentType && parentType === 'Document'
                    ? 'Object'
                    : parentType
                }
                keyName={key.value}
                onAddFieldAfterElement={() => {
                  const el = element.insertSiblingPlaceholder();
                  onAddElement(el);
                }}
                onAddFieldToElement={
                  type.value === 'Object' || type.value === 'Array'
                    ? () => {
                        const el = element.insertPlaceholder();
                        onAddElement(el);
                        expand();
                      }
                    : undefined
                }
              ></AddFieldActions>
            </div>
          </div>
        )}
        <div className={elementSpacer} style={{ width: elementSpacerWidth }}>
          {/* spacer for nested documents */}
        </div>
        <div className={elementExpand}>
          {expandable && (
            <button
              type="button"
              className={expandButton}
              aria-pressed={expanded}
              aria-label={
                expanded ? 'Collapse field items' : 'Expand field items'
              }
              onClick={(evt) => {
                evt.stopPropagation();
                toggleExpanded();
              }}
            >
              <Icon
                size="xsmall"
                glyph={expanded ? 'CaretDown' : 'CaretRight'}
              ></Icon>
            </button>
          )}
        </div>
        <div {...keyProps} data-testid="hadron-document-element-key">
          {key.editable ? (
            <KeyEditor
              value={key.value}
              valid={key.valid}
              validationMessage={key.validationMessage}
              onChange={(newVal) => {
                key.change(newVal);
              }}
              // This autofocus will only trigger after user deliberately
              // double-clicked on a field and so auto focusing the input is
              // expected in this case
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={autoFocus?.id === id && autoFocus.type === 'key'}
              editing={editingEnabled}
              onEditStart={() => {
                onEditStart?.(element.uuid, 'key');
              }}
            ></KeyEditor>
          ) : (
            <span>{key.value}</span>
          )}
        </div>
        <div className={elementDivider} role="presentation">
          :&nbsp;
        </div>
        <div className={elementDivider} role="presentation">
          {value.decrypted && (
            <span
              data-testid="hadron-document-element-decrypted-icon"
              title="Encrypted Field"
            >
              <Icon glyph="Key" size="small" />
            </span>
          )}
        </div>
        <div
          className={elementValue}
          data-testid="hadron-document-element-value"
        >
          {value.editable ? (
            <ValueEditor
              type={type.value}
              originalValue={value.originalValue}
              value={value.value}
              valid={value.valid}
              validationMessage={value.validationMessage}
              onChange={(newVal) => {
                value.change(newVal);
              }}
              // See above
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={autoFocus?.id === id && autoFocus.type === 'value'}
              editing={editingEnabled}
              onEditStart={() => {
                onEditStart?.(element.uuid, 'value');
              }}
              onFocus={() => {
                value.startEdit();
              }}
              onBlur={() => {
                value.completeEdit();
              }}
            ></ValueEditor>
          ) : (
            <div
              data-testid={
                editable && !editingEnabled
                  ? 'hadron-document-clickable-value'
                  : undefined
              }
              onDoubleClick={() => {
                if (editable && !editingEnabled) {
                  onEditStart?.(element.uuid, 'type');
                }
              }}
            >
              <BSONValue
                type={type.value as any}
                value={value.originalValue}
              ></BSONValue>
            </div>
          )}
        </div>
        {editable && (
          <div
            className={elementType}
            data-testid="hadron-document-element-type"
          >
            <TypeEditor
              editing={editingEnabled}
              type={type.value}
              // See above
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={autoFocus?.id === id && autoFocus.type === 'type'}
              onChange={(newType) => {
                type.change(newType);

                // When we change the type to an object or array we auto
                // expand them to make seeding data a bit quicker.
                if (newType === 'Array' || newType === 'Object') {
                  expand();
                }
              }}
            ></TypeEditor>
          </div>
        )}
      </div>
      {expandable && expanded && (
        <>
          {visibleChildren.map((el, idx) => {
            return (
              <HadronElement
                key={idx}
                value={el}
                editable={editable}
                editingEnabled={editingEnabled}
                onEditStart={onEditStart}
                lineNumberSize={lineNumberSize}
                onAddElement={onAddElement}
                extraGutterWidth={extraGutterWidth}
              ></HadronElement>
            );
          })}
          <VisibleFieldsToggle
            parentFieldName={key.value}
            // TODO: (Same as that for Document) "Hide items" button will only
            // be shown when document is not edited because it's not decided how
            // to handle changes to the fields that are changed but then hidden
            // https://jira.mongodb.org/browse/COMPASS-5587
            showHideButton={!editingEnabled}
            currentSize={element.maxVisibleElementsCount}
            totalSize={children.length}
            minSize={DEFAULT_VISIBLE_ELEMENTS}
            // Same as that for Document renderer, in the editing mode we allow
            // to show / hide less fields because historically Compass was doing
            // this for "performance" reasons
            step={editingEnabled ? DEFAULT_VISIBLE_ELEMENTS : 1000}
            onSizeChange={handleVisibleElementsChanged}
            style={{
              paddingLeft: nestedElementsVisibilityToggleOffset,
            }}
          ></VisibleFieldsToggle>
        </>
      )}
    </>
  );
};
