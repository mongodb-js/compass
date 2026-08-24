import React from 'react';
import type { Element as HadronElementType } from 'hadron-document';
import type { TypeCastMap } from 'hadron-type-checker';
import TypeChecker, { isUUIDType } from 'hadron-type-checker';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import BSONValue from '../bson-value';
import { mergeProps } from '../../utils/merge-props';
import { Icon, Tooltip } from '../leafygreen';
import { useDarkMode } from '../../hooks/use-theme';
import {
  editorInvalidStyles,
  editorInvalidLightModeStyles,
  editorInvalidDarkModeStyles,
  editorStyles,
} from './editors/shared';
import type { EditorInputProps } from './editors/shared';
import { DateEditor } from './editors/date-editor';
import { DefaultEditor } from './editors/default-editor';
import { TextEditor } from './editors/text-editor';
import { UUIDEditor } from './editors/uuid-editor';

const maxWidth = css({
  maxWidth: '100%',
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
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
  // On Safari if a text is 5 mono-characters wide and is supposed to overflow /
  // get ellipse'd only when shorter than that, it would still overflow and get
  // ellipse'd under normal conditions, for unknown reasons. For that, we add a
  // small amount to the width to tackle this issue.
  const width = `${Math.max(value.length, 1)}.5ch`;

  return (
    <>
      {editing ? (
        <Tooltip
          darkMode
          enabled={!valid}
          trigger={({
            className,
            children,
            // Having a tooltip connected to the input elements is not the most
            // accessible thing ever and so a lot of event listeners of the
            // tooltip conflict with the textarea default behavior (due to
            // preventDefault). Because of that we exclude them, so the tooltip
            // will still be visible, but only on hover or focus, which is okay
            // for our case
            onDragStart,
            onPointerUp,
            onPointerDown,
            onMouseDown,
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
                    editorStyles,
                    !valid && editorInvalidStyles,
                    !valid &&
                      (darkMode
                        ? editorInvalidDarkModeStyles
                        : editorInvalidLightModeStyles)
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

export const ValueEditor: React.FunctionComponent<{
  editing?: boolean;
  onEditStart(): void;
  type: keyof TypeCastMap;
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
  if (!editing) {
    // Double-click is not accessible so no reason for this to be a button,
    // users won't be able to interact with it anyway
    return (
      <div
        data-testid="hadron-document-clickable-value"
        onDoubleClick={onEditStart}
      >
        <BSONValue type={type as any} value={originalValue}></BSONValue>
      </div>
    );
  }

  const sharedProps = {
    autoFocus,
    value: String(value),
    valid,
    onChange,
    onBlur,
  };

  return (
    <Tooltip
      darkMode
      enabled={!valid}
      trigger={({
        className,
        children,
        // See above
        onDragStart,
        onPointerUp,
        onPointerDown,
        onMouseDown,
        ...triggerProps
      }: React.HTMLProps<HTMLElement>) => {
        // NB: Order is important, if triggerProps has onFocus / onBlur we
        // want to merge them with ours, if they are not passed, we want our
        // listeners to overwrite undefined keys
        const mergedProps = mergeProps(triggerProps, {
          onBlur,
          onFocus,
        }) as EditorInputProps;
        return (
          <div className={className}>
            {type === 'String' ? (
              <TextEditor {...mergedProps} {...sharedProps} />
            ) : type === 'Date' ? (
              <DateEditor {...sharedProps} {...mergedProps} type={type} />
            ) : isUUIDType(type) ? (
              <UUIDEditor {...sharedProps} {...mergedProps} type={type} />
            ) : (
              <DefaultEditor {...sharedProps} {...mergedProps} type={type} />
            )}
            {children}
          </div>
        );
      }}
    >
      {validationMessage}
    </Tooltip>
  );
};

const TYPES = TypeChecker.castableTypes(true);

const longestTypeNameCharLength = Math.max(...TYPES.map((type) => type.length));

const typeEditor = css({
  color: palette.gray.base,
  appearance: 'none',
  // Accounting for the margin that `appearance: auto` will add to the shadow
  // dom inside select node
  paddingLeft: spacing[100],
  width: `calc(${longestTypeNameCharLength}ch + ${spacing[600]}px)`,
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
              editorStyles,
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
