import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import type {
  default as HadronDocumentType,
  Element as HadronElementType,
  Editor as EditorType,
} from 'hadron-document';
import { ElementEvents, ElementEditor } from 'hadron-document';
import BSONValue from '../bson-value';
import { spacing } from '@leafygreen-ui/tokens';
import { KeyEditor, ValueEditor, TypeEditor } from './element-editors';
import { EditActions, AddFieldActions } from './element-actions';
import { FontAwesomeIcon } from './font-awesome-icon';
import { useAutoFocusContext } from './auto-focus-context';
import { useForceUpdate } from './use-force-update';

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

  if (!editor.current) {
    const Editor = getEditorByType(el.currentType);
    editor.current = new Editor(el);
  }

  useEffect(() => {
    if (
      editor.current?.element.uuid !== el.uuid ||
      editor.current?.element.currentType !== el.currentType
    ) {
      const Editor = getEditorByType(el.currentType);
      editor.current = new Editor(el);
    }
  }, [el, el.uuid, el.currentType]);

  return editor.current;
}

function useHadronElement(el: HadronElementType) {
  const forceUpdate = useForceUpdate();
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

  useEffect(() => {
    el.on(ElementEvents.Converted, onElementChanged);
    el.on(ElementEvents.Edited, onElementChanged);
    el.on(ElementEvents.Reverted, onElementChanged);
    el.on(ElementEvents.Invalid, onElementChanged);
    el.on(ElementEvents.Valid, onElementChanged);
    el.on(ElementEvents.Added, onElementAddedOrRemoved);
    el.on(ElementEvents.Removed, onElementAddedOrRemoved);

    return () => {
      el.off(ElementEvents.Converted, onElementChanged);
      el.off(ElementEvents.Edited, onElementChanged);
      el.off(ElementEvents.Reverted, onElementChanged);
      el.off(ElementEvents.Valid, onElementChanged);
      el.off(ElementEvents.Added, onElementAddedOrRemoved);
      el.off(ElementEvents.Removed, onElementAddedOrRemoved);
    };
  }, [el, onElementChanged, onElementAddedOrRemoved]);

  const isValid = el.isCurrentTypeValid();

  return {
    id: el.uuid,
    key: {
      value: el.currentKey,
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
      originalValue: el.currentValue,
      change(newVal: string) {
        editor.edit(newVal);
      },
      editable:
        el.isValueEditable() &&
        el.currentType !== 'Object' &&
        el.currentType !== 'Array',
      valid: isValid,
      validationMessage: !isValid ? el.invalidTypeMessage ?? null : null,
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
    level: el.level,
    parentType: el.parent?.currentType,
    removed: el.isRemoved(),
  };
}
const buttonReset = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
});

const hadronElement = css({
  display: 'flex',
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
  '&:hover': {
    backgroundColor: uiColors.gray.light2,
  },
});

const elementInvalid = css({
  backgroundColor: uiColors.yellow.light3,
  '&:hover': {
    backgroundColor: uiColors.yellow.light2,
  },
});

const elementRemoved = css({
  backgroundColor: uiColors.red.light3,
  '&:hover': {
    backgroundColor: uiColors.red.light2,
  },
});

const elementActions = css({
  flex: 'none',
  width: spacing[3],
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
    color: uiColors.gray.base,
  },
});

const lineNumberInvalid = css({
  backgroundColor: uiColors.yellow.base,
  '&::before': {
    color: uiColors.yellow.dark2,
  },
});

const lineNumberRemoved = css({
  backgroundColor: uiColors.red.base,
  color: uiColors.red.light3,
  '&::before': {
    color: uiColors.red.light3,
  },
});

const elementSpacer = css({
  flex: 'none',
});

const elementExpand = css({
  width: spacing[3],
  flex: 'none',
});

const elementKey = css({
  flex: 'none',
  fontWeight: 'bold',
  maxWidth: '70%',
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

export const HadronElement: React.FunctionComponent<{
  value: HadronElementType;
  editingEnabled: boolean;
  onEditStart?: (id: string, field: 'key' | 'value') => void;
  allExpanded: boolean;
  lineNumberSize: number;
  onAddElement(el: HadronElementType): void;
}> = ({
  value: element,
  editingEnabled,
  onEditStart,
  allExpanded,
  lineNumberSize,
  onAddElement,
}) => {
  const autoFocus = useAutoFocusContext();
  const [expanded, setExpanded] = useState(allExpanded);
  const {
    id,
    key,
    value,
    type,
    revert,
    remove,
    expandable,
    children,
    level,
    parentType,
    removed,
  } = useHadronElement(element);

  useEffect(() => {
    setExpanded(allExpanded);
  }, [allExpanded]);

  const toggleExpanded = useCallback(() => {
    setExpanded((val) => !val);
  }, []);

  const lineNumberMinWidth = useMemo(() => {
    // Only account for ~ line count length if we are in editing mode
    if (editingEnabled) {
      const charCount = String(lineNumberSize).length;
      return charCount > 2 ? `${charCount}.5ch` : spacing[3];
    }
    return spacing[3];
  }, [lineNumberSize, editingEnabled]);

  const onLineClick = useCallback(() => {
    toggleExpanded();
  }, [toggleExpanded]);

  const isValid = key.valid && value.valid;
  const shouldShowActions = editingEnabled;

  const elementProps = {
    className: cx(
      hadronElement,
      removed ? elementRemoved : editingEnabled && !isValid && elementInvalid
    ),
    onClick: onLineClick,
  };

  return (
    <>
      <div data-document-element="true" {...elementProps}>
        <div className={elementActions}>
          <div className={cx(actions, shouldShowActions && actionsVisible)}>
            <EditActions
              onRevert={revert}
              onRemove={remove}
              editing={editingEnabled}
            ></EditActions>
          </div>
        </div>
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
                parentType && parentType === 'Document' ? 'Object' : parentType
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
                      setExpanded(true);
                    }
                  : undefined
              }
            ></AddFieldActions>
          </div>
        </div>
        <div
          className={elementSpacer}
          style={{ width: spacing[2] + spacing[3] * level }}
        >
          {/* spacer for nested documents */}
        </div>
        <div className={elementExpand}>
          {expandable && (
            <button
              className={buttonReset}
              aria-pressed={expanded}
              aria-label={
                expanded ? 'Collapse field items' : 'Expand field items'
              }
              onClick={(evt) => {
                evt.stopPropagation();
                toggleExpanded();
              }}
            >
              <FontAwesomeIcon
                icon={expanded ? 'expanded' : 'collapsed'}
              ></FontAwesomeIcon>
            </button>
          )}
        </div>
        <div className={elementKey}>
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
        <div className={elementValue}>
          {value.editable ? (
            <ValueEditor
              type={type.value}
              originalValue={value.originalValue}
              value={value.value as string}
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
            ></ValueEditor>
          ) : (
            <BSONValue
              type={type.value as any}
              value={value.originalValue}
            ></BSONValue>
          )}
        </div>
        <div className={elementType}>
          <TypeEditor
            editing={editingEnabled}
            type={type.value}
            onChange={(newType) => {
              type.change(newType);
            }}
          ></TypeEditor>
        </div>
      </div>
      {expandable &&
        expanded &&
        children.map((el) => {
          return (
            <HadronElement
              key={el.uuid}
              value={el}
              editingEnabled={editingEnabled}
              onEditStart={onEditStart}
              allExpanded={allExpanded}
              lineNumberSize={lineNumberSize}
              onAddElement={onAddElement}
            ></HadronElement>
          );
        })}
    </>
  );
};
