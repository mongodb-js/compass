import React, { useCallback, useRef } from 'react';
import {
  Label,
  TextInput,
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { connect } from '../stores/context';
import OptionEditor from './option-editor';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import type {
  QueryOptionOfTypeDocument,
  QueryOption as QueryOptionType,
} from '../constants/query-option-definition';
import { changeField } from '../stores/query-bar-reducer';
import type { QueryProperty } from '../constants/query-properties';
import type { RootState } from '../stores/query-bar-store';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

const queryOptionStyles = css({
  display: 'flex',
  position: 'relative',
  alignItems: 'flex-start',
});

const documentEditorOptionContainerStyles = css({
  flexGrow: 1,
});

const queryOptionLabelStyles = css({
  marginRight: spacing[200],
});

const documentEditorQueryOptionLabelStyles = css(queryOptionLabelStyles, {
  minWidth: spacing[800] * 2,
});

const documentEditorOptionStyles = css({
  minWidth: spacing[7],
  display: 'flex',
  flexGrow: 1,
});

const numericTextInputLightStyles = css({
  input: {
    borderColor: 'transparent',
  },
});

const numericTextInputDarkStyles = css({
  input: {
    borderColor: 'transparent',
  },
});

const optionInputWithErrorStyles = css({
  input: {
    borderColor: palette.red.base,
  },
});

const queryOptionLabelContainerStyles = css({
  // Hardcoded height as we want the label not to vertically
  // center on the input area when it's expanded.
  height: spacing[600] + spacing[100],
  textTransform: 'capitalize',
  display: 'flex',
  alignItems: 'center',
});

export const documentEditorLabelContainerStyles = css(
  queryOptionLabelContainerStyles,
  {
    minWidth: spacing[800] * 2,
  }
);

type QueryBarProperty = Exclude<QueryProperty, 'update'>;

type QueryOptionProps = {
  id: string;
  name: QueryBarProperty;
  value?: string;
  hasError: boolean;
  onChange: (name: QueryBarProperty, value: string) => void;
  placeholder?: string | (() => HTMLElement);
  onApply?(): void;
  disabled?: boolean;
};

// Helper component to allow flexible computation of extra props for the TextInput
// component if the query option definition suggests it. In particular,
// using a separate component allows those extra props to use React hooks in their definition.
const WithOptionDefinitionTextInputProps: React.FunctionComponent<{
  definition: typeof OPTION_DEFINITION[QueryOptionType];
  children: ({
    props,
  }: {
    props: Partial<React.ComponentProps<typeof TextInput>>;
  }) => JSX.Element;
}> = ({ definition, children }) => {
  let props: Partial<React.ComponentProps<typeof TextInput>> = {};
  if (definition.type === 'numeric') {
    props.inputMode = 'numeric';
    props.pattern = '[0-9]*';
  }
  props = { ...props, ...definition.extraTextInputProps?.() };
  return children({ props });
};

const QueryOption: React.FunctionComponent<QueryOptionProps> = ({
  hasError,
  onChange,
  id,
  placeholder,
  name,
  value,
  onApply,
  disabled = false,
}) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const darkMode = useDarkMode();
  const editorInitialValueRef = useRef<string | undefined>(value);
  const editorCurrentValueRef = useRef<string | undefined>(value);
  editorCurrentValueRef.current = value;

  const optionDefinition = OPTION_DEFINITION[name];
  const isDocumentEditor = optionDefinition.type === 'document';

  placeholder ??= optionDefinition.placeholder;
  value ??= '';

  const onValueChange = useCallback(
    (newVal: string) => {
      return onChange(name, newVal);
    },
    [name, onChange]
  );

  const onBlurEditor = useCallback(() => {
    if (
      !!editorCurrentValueRef.current &&
      editorCurrentValueRef.current !== editorInitialValueRef.current &&
      (editorInitialValueRef.current || editorCurrentValueRef.current !== '{}')
    ) {
      track('Query Edited', { option_name: name }, connectionInfoRef.current);
      editorInitialValueRef.current = editorCurrentValueRef.current;
    }
  }, [track, name, connectionInfoRef]);

  return (
    <div
      className={cx(
        queryOptionStyles,
        isDocumentEditor && documentEditorOptionContainerStyles
      )}
      data-testid={`query-bar-option-${name}`}
    >
      {/* The filter label is shown by the query bar. */}
      {name !== 'filter' && (
        <div
          className={
            isDocumentEditor
              ? documentEditorLabelContainerStyles
              : queryOptionLabelContainerStyles
          }
        >
          <Label
            htmlFor={id}
            id={`query-bar-option-input-${name}-label`}
            disabled={disabled}
            className={
              isDocumentEditor
                ? documentEditorQueryOptionLabelStyles
                : queryOptionLabelStyles
            }
          >
            {optionDefinition.label ?? name}
          </Label>
        </div>
      )}
      <div className={cx(isDocumentEditor && documentEditorOptionStyles)}>
        {isDocumentEditor ? (
          <OptionEditor
            optionName={name as QueryOptionOfTypeDocument}
            hasError={hasError}
            id={id}
            onChange={onValueChange}
            onBlur={onBlurEditor}
            placeholder={placeholder}
            value={value}
            data-testid={`query-bar-option-${name}-input`}
            onApply={onApply}
            disabled={disabled}
          />
        ) : (
          <WithOptionDefinitionTextInputProps definition={optionDefinition}>
            {({ props }) => (
              <TextInput
                aria-labelledby={`query-bar-option-input-${name}-label`}
                id={id}
                data-testid={`query-bar-option-${name}-input`}
                className={cx(
                  darkMode
                    ? numericTextInputDarkStyles
                    : numericTextInputLightStyles,
                  hasError && optionInputWithErrorStyles
                )}
                type="text"
                sizeVariant="small"
                state={hasError ? 'error' : 'none'}
                value={value}
                onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
                  onValueChange(evt.currentTarget.value)
                }
                onBlur={onBlurEditor}
                placeholder={placeholder as string}
                disabled={disabled}
                {...props}
              />
            )}
          </WithOptionDefinitionTextInputProps>
        )}
      </div>
    </div>
  );
};

const ConnectedQueryOption = connect(
  (state: RootState, ownProps: { name: QueryProperty }) => {
    const field = state.queryBar.fields[ownProps.name];
    return {
      value: field.string,
      hasError: !field.valid,
    };
  },
  { onChange: changeField }
)(QueryOption);

export default ConnectedQueryOption;
