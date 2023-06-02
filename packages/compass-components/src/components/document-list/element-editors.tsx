import React, { useMemo } from 'react';
import type { Element as HadronElementType } from 'hadron-document';
import type { TypeCastMap } from 'hadron-type-checker';
import TypeChecker from 'hadron-type-checker';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import BSONValue, { BSONValueContainer } from '../bson-value';
import { Tooltip } from '../tooltip';
import { mergeProps } from '../../utils/merge-props';
import { documentTypography } from './typography';
import { Icon } from '../leafygreen';
import { useDarkMode } from '../../hooks/use-theme';

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
    boxShadow: `0 0 0 2px ${palette.blue.light1}`,
  },
});

const editorInvalid = css({
  '&:focus, &:active': {
    boxShadow: `0 0 0 2px ${palette.red.dark2}`,
  },
});

const editorInvalidLightMode = css({
  backgroundColor: palette.red.light2,
  color: palette.red.dark2,
});

const editorInvalidDarkMode = css({
  backgroundColor: palette.red.dark2,
  color: palette.red.light2,
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
  const darkMode = useDarkMode();
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
                  // See ./element.tsx
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={autoFocus}
                  className={cx(
                    maxWidth,
                    editorReset,
                    editorOutline,
                    !valid && editorInvalid,
                    !valid &&
                      (darkMode
                        ? editorInvalidDarkMode
                        : editorInvalidLightMode)
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
  color: 'inherit',
});

export const ValueEditor: React.FunctionComponent<{
  editing?: boolean;
  onEditStart(): void;
  type: string;
  value: string;
  valid: boolean;
  validationMessage: string | null;
  originalValue: TypeCastMap[keyof TypeCastMap];
  autoFocus?: boolean;
  onChange(newVal: string): void;
  onFocus(): void;
  onBlur(): void;
}> = ({
  editing,
  onEditStart,
  type,
  value,
  valid,
  validationMessage,
  originalValue,
  autoFocus,
  onChange,
  onFocus,
  onBlur,
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
      const minHeight =
        documentTypography.lineHeight * Math.min(minLines, maxLines);
      const height = documentTypography.lineHeight * maxLines;

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
          }: React.HTMLProps<HTMLElement>) => {
            // NB: Order is important, if triggerProps has onFocus / onBlur we
            // want to merge them with ours, if they are not passed, we want our
            // listeners to overwrite undefined keys
            const mergedProps = mergeProps(triggerProps, { onBlur, onFocus });

            return (
              <div className={className}>
                {type === 'String' ? (
                  <BSONValueContainer
                    type="String"
                    className={cx(textareaContainer)}
                  >
                    <textarea
                      data-testid="hadron-document-value-editor"
                      value={val}
                      onChange={(evt) => {
                        onChange(evt.currentTarget.value);
                      }}
                      // See ./element.tsx
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
                      {...(mergedProps as React.HTMLProps<HTMLTextAreaElement>)}
                    ></textarea>
                  </BSONValueContainer>
                ) : (
                  <input
                    type="text"
                    data-testid="hadron-document-value-editor"
                    value={val}
                    onChange={(evt) => {
                      onChange(evt.currentTarget.value);
                    }}
                    // See ./element.tsx
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={autoFocus}
                    className={cx(
                      editorReset,
                      editorOutline,
                      !valid && editorInvalid
                    )}
                    style={inputStyle}
                    spellCheck="false"
                    {...(mergedProps as React.HTMLProps<HTMLInputElement>)}
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
  color: palette.gray.base,
  appearance: 'none',
  // Accounting for the margin that `appearance: auto` will add to the shadow
  // dom inside select node
  paddingLeft: spacing[1],
  width: `calc(${longestTypeNameCharLength}ch + ${spacing[4]}px)`,
  '&:hover': {
    color: 'inherit',
    cursor: 'pointer',
  },
});

const typeEditorActive = css({
  appearance: 'auto',
  paddingLeft: 0,
});

const typeEditorChevron = css({
  position: 'absolute',
  right: 4,
  top: 2,
  pointerEvents: 'none',
  display: 'none',
});

const typeEditorOptionLight = css({
  backgroundColor: palette.white,
});

const typeEditorOptionDark = css({
  backgroundColor: palette.black,
});

const typeEditorContainer = css({
  [`&:hover .${typeEditorChevron}`]: { display: 'block' },
  position: 'relative',
  cursor: 'pointer',
});

export const TypeEditor: React.FunctionComponent<{
  editing?: boolean;
  autoFocus?: boolean;
  type: HadronElementType['type'];
  onChange(newVal: HadronElementType['type']): void;
  visuallyActive?: boolean;
}> = ({ editing, autoFocus, type, onChange, visuallyActive }) => {
  const darkMode = useDarkMode();

  return (
    <>
      {editing && (
        <div className={typeEditorContainer}>
          {/* This rule is deprecated https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/no-onchange.md#deprecated-no-onchange */}
          {/* eslint-disable-next-line jsx-a11y/no-onchange */}
          <select
            value={type}
            data-testid="hadron-document-type-editor"
            // See ./element.tsx
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            onChange={(evt) => {
              onChange(evt.currentTarget.value as HadronElementType['type']);
            }}
            className={cx(
              editorReset,
              editorOutline,
              typeEditor,
              visuallyActive && typeEditorActive
            )}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {TYPES.map((type) => {
              return (
                <option
                  key={type}
                  value={type}
                  className={
                    darkMode ? typeEditorOptionDark : typeEditorOptionLight
                  }
                >
                  {type}
                </option>
              );
            })}
          </select>
          <Icon
            glyph="ChevronDown"
            size="xsmall"
            className={typeEditorChevron}
          ></Icon>
        </div>
      )}
    </>
  );
};
