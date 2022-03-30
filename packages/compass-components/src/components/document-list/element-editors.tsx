import React, { useMemo } from 'react';
import type { Element as HadronElementType } from 'hadron-document';
import type { TypeCastMap } from 'hadron-type-checker';
import TypeChecker from 'hadron-type-checker';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import BSONValue, { hasCustomColor, VALUE_COLOR_BY_TYPE } from '../bson-value';
import { Tooltip } from '../tooltip';

const maxWidth = css({
  maxWidth: '100%',
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
});

const editorReset = css({
  padding: 0,
  margin: 0,
  border: 'none',
  boxShadow: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  maxWidth: '100%',
});

const editorOutline = css({
  '&:focus, &:active': {
    borderRadius: `2px`,
    boxShadow: `0 0 0 2px ${uiColors.focus}`,
  },
});

const editorInvalid = css({
  backgroundColor: uiColors.red.light2,
  color: uiColors.red.dark2,
  '&:focus, &:active': {
    boxShadow: `0 0 0 2px ${uiColors.red.dark2}`,
  },
});

export const KeyEditor: React.FunctionComponent<{
  editing?: boolean;
  onEditStart(): void;
  value: string;
  valid: boolean;
  validationMessage: string | null;
  onChange(newVal: string): void;
  autoFocus?: boolean;
}> = ({
  editing,
  value,
  valid,
  validationMessage,
  onChange,
  autoFocus,
  onEditStart,
}) => {
  const width = `${Math.max(value.length, 1)}ch`;

  return (
    <>
      {editing ? (
        <Tooltip
          darkMode
          isDisabled={valid}
          delay={600}
          usePortal={false}
          trigger={({
            className,
            children,
            // Having a tooltip connected to the input elements is not the most
            // accessible thing ever and so a lot of event listeners of the
            // tooltip conflict with the textarea default behavior (due to
            // preventDefault). Because of that we exclude them, so the tooltip
            // will still be visible, but only on hover or focus, which is okay
            // for our case
            /* eslint-disable @typescript-eslint/no-unused-vars */
            onDragStart,
            onPointerUp,
            onPointerDown,
            onMouseDown,
            /* eslint-enable @typescript-eslint/no-unused-vars */
            ...triggerProps
          }: React.HTMLProps<HTMLInputElement>) => {
            return (
              <div className={className}>
                <input
                  type="text"
                  data-testid="hadron-document-key-editor"
                  value={value}
                  onChange={(evt) => {
                    onChange(evt.currentTarget.value);
                  }}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={autoFocus}
                  className={cx(
                    maxWidth,
                    editorReset,
                    editorOutline,
                    !valid && editorInvalid
                  )}
                  style={{ width }}
                  spellCheck="false"
                  {...triggerProps}
                ></input>
                {children}
              </div>
            );
          }}
        >
          {validationMessage}
        </Tooltip>
      ) : (
        // Double-click is not accessible so no reason for this to be a button
        <div
          data-testid="hadron-document-clickable-key"
          onDoubleClick={onEditStart}
          className={maxWidth}
          style={{ width }}
        >
          {value}
        </div>
      )}
    </>
  );
};

const textareaContainer = css({
  width: '100%',
  maxWidth: '100%',
  '&::before, &::after': {
    content: "'\"'",
    userSelect: 'none',
  },
});

const editorTextarea = css({
  display: 'inline-block',
  whiteSpace: 'nowrap',
  minWidth: '5ch',
  // 2ch for `"` around the textarea
  maxWidth: 'calc(100% - 2ch)',
  verticalAlign: 'top',
});

const valueContainer = css({});

function getCustomColorStyle(type: string): string {
  return hasCustomColor(type) ? css({ color: VALUE_COLOR_BY_TYPE[type] }) : '';
}

export const ValueEditor: React.FunctionComponent<{
  editing?: boolean;
  onEditStart(): void;
  type: string;
  value: string;
  valid: boolean;
  validationMessage: string | null;
  originalValue: TypeCastMap[keyof TypeCastMap];
  onChange(newVal: string): void;
  autoFocus?: boolean;
}> = ({
  editing,
  onEditStart,
  type,
  value,
  valid,
  validationMessage,
  originalValue,
  onChange,
  autoFocus,
}) => {
  const val = String(value);

  const inputStyle = useMemo(() => {
    if (type === 'String') {
      const lines = val.split('\n');
      const longestLineCharLength = Math.max(
        ...lines.map((line) => line.length)
      );
      const width = `${Math.min(
        // Adding one to account for a textarea resize icon button thingie
        longestLineCharLength + 1,
        70
      )}ch`;
      const minLines = Math.max(
        lines.length,
        longestLineCharLength > 70 ? 2 : 1
      );
      const maxLines = Math.min(minLines, 10);
      const minHeight = spacing[3] * Math.min(minLines, maxLines);
      const height = spacing[3] * maxLines;

      return { width, minHeight, height };
    }

    return { width: `${Math.max(val.length, 1)}ch` };
  }, [val, type]);

  return (
    <>
      {editing ? (
        <Tooltip
          darkMode
          isDisabled={valid}
          delay={600}
          usePortal={false}
          trigger={({
            className,
            children,
            // See above
            /* eslint-disable @typescript-eslint/no-unused-vars */
            onDragStart,
            onPointerUp,
            onPointerDown,
            onMouseDown,
            /* eslint-enable @typescript-eslint/no-unused-vars */
            ...triggerProps
          }: React.HTMLProps<HTMLInputElement>) => {
            return (
              <div className={className}>
                {type === 'String' ? (
                  <div
                    className={cx(textareaContainer, getCustomColorStyle(type))}
                  >
                    <textarea
                      data-testid="hadron-document-value-editor"
                      value={val}
                      onChange={(evt) => {
                        onChange(evt.currentTarget.value);
                      }}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus={autoFocus}
                      className={cx(
                        editorReset,
                        editorOutline,
                        editorTextarea,
                        !valid && editorInvalid
                      )}
                      spellCheck="false"
                      style={inputStyle}
                      {...(triggerProps as React.HTMLProps<HTMLTextAreaElement>)}
                    ></textarea>
                  </div>
                ) : (
                  <input
                    type="text"
                    data-testid="hadron-document-value-editor"
                    value={val}
                    onChange={(evt) => {
                      onChange(evt.currentTarget.value);
                    }}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={autoFocus}
                    className={cx(
                      editorReset,
                      editorOutline,
                      getCustomColorStyle(type),
                      !valid && editorInvalid
                    )}
                    style={inputStyle}
                    spellCheck="false"
                    {...triggerProps}
                  ></input>
                )}
                {children}
              </div>
            );
          }}
        >
          {validationMessage}
        </Tooltip>
      ) : (
        // Double-click is not accessible so no reason for this to be a button,
        // users won't be able to interact with it anyway
        <div
          data-testid="hadron-document-clickable-value"
          className={valueContainer}
          onDoubleClick={onEditStart}
        >
          <BSONValue type={type as any} value={originalValue}></BSONValue>
        </div>
      )}
    </>
  );
};

const TYPES = TypeChecker.castableTypes(true);

const longestTypeNameCharLength = Math.max(...TYPES.map((type) => type.length));

const typeEditor = css({
  color: uiColors.gray.base,
  appearance: 'none',
  // Accounting for the margin that `appearance: auto` will add to the shadow
  // dom inside select node
  paddingLeft: spacing[1],
  width: `calc(${longestTypeNameCharLength}ch + ${spacing[4]}px)`,
  '&:hover, &:focus, &:focus-within, &:active': {
    appearance: 'auto',
    paddingLeft: 0,
    color: 'inherit',
  },
});

const typeEditorActive = css({
  appearance: 'auto',
  paddingLeft: 0,
});

export const TypeEditor: React.FunctionComponent<{
  editing?: boolean;
  type: HadronElementType['type'];
  onChange(newVal: HadronElementType['type']): void;
  visuallyActive?: boolean;
}> = ({ editing, type, onChange, visuallyActive }) => {
  return (
    <>
      {editing && (
        // This rule is deprecated
        // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/no-onchange.md#deprecated-no-onchange
        // eslint-disable-next-line jsx-a11y/no-onchange
        <select
          value={type}
          data-testid="hadron-document-type-editor"
          onChange={(evt) => {
            onChange(evt.currentTarget.value as HadronElementType['type']);
          }}
          className={cx(
            editorReset,
            editorOutline,
            typeEditor,
            visuallyActive && typeEditorActive
          )}
        >
          {TYPES.map((type) => {
            return (
              <option key={type} value={type}>
                {type}
              </option>
            );
          })}
        </select>
      )}
    </>
  );
};
