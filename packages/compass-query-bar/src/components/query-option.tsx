import React from 'react';
import {
  Label,
  TextInput,
  css,
  cx,
  spacing,
  palette,
  withTheme,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';

import { OptionEditor } from './option-editor';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import type { QueryOption as QueryOptionType } from '../constants/query-option-definition';
import type { CompletionWithServerInfo } from '@mongodb-js/compass-editor';

const queryOptionStyles = css({
  display: 'flex',
  position: 'relative',
  alignItems: 'flex-start',
});

const documentEditorOptionContainerStyles = css({
  flexGrow: 1,
});

const queryOptionLabelStyles = css({
  marginRight: spacing[2],
});

const documentEditorQueryOptionLabelStyles = cx(
  queryOptionLabelStyles,
  css({
    minWidth: spacing[5] * 3,
  })
);

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
  height: spacing[4] + spacing[1],
  textTransform: 'capitalize',
  display: 'flex',
  alignItems: 'center',
});

export const documentEditorLabelContainerStyles = cx(
  queryOptionLabelContainerStyles,
  css({
    minWidth: spacing[5] * 3,
  })
);

type QueryOptionProps = {
  darkMode?: boolean;
  hasError: boolean;
  id: string;
  onChange: (value: string) => void;
  onApply: () => void;
  placeholder?: string;
  queryOption: QueryOptionType;
  refreshEditorAction: Listenable;
  schemaFields: CompletionWithServerInfo[];
  serverVersion: string;
  value?: string;
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
  return <>{children({ props })}</>;
};

const UnthemedQueryOption: React.FunctionComponent<QueryOptionProps> = ({
  darkMode,
  hasError,
  onApply,
  onChange,
  id,
  placeholder = '',
  queryOption,
  refreshEditorAction,
  schemaFields = [],
  serverVersion,
  value = '',
}) => {
  const optionDefinition = OPTION_DEFINITION[queryOption];
  const isDocumentEditor = optionDefinition.type === 'document';
  placeholder ||= optionDefinition.placeholder;

  return (
    <div
      className={cx(
        queryOptionStyles,
        isDocumentEditor && documentEditorOptionContainerStyles
      )}
      data-testid={`query-bar-option-${queryOption}`}
    >
      {/* The filter label is shown by the query bar. */}
      {queryOption !== 'filter' && (
        <div
          className={
            isDocumentEditor
              ? documentEditorLabelContainerStyles
              : queryOptionLabelContainerStyles
          }
        >
          <Label
            htmlFor={id}
            id={`query-bar-option-input-${queryOption}-label`}
            className={
              isDocumentEditor
                ? documentEditorQueryOptionLabelStyles
                : queryOptionLabelStyles
            }
          >
            {queryOption}
          </Label>
        </div>
      )}
      <div className={cx(isDocumentEditor && documentEditorOptionStyles)}>
        {isDocumentEditor ? (
          <OptionEditor
            hasError={hasError}
            id={id}
            queryOption={queryOption}
            onApply={onApply}
            onChange={onChange}
            placeholder={placeholder}
            refreshEditorAction={refreshEditorAction}
            schemaFields={schemaFields}
            serverVersion={serverVersion}
            value={value}
            data-testid={`query-bar-option-${queryOption}-input`}
          />
        ) : (
          <WithOptionDefinitionTextInputProps definition={optionDefinition}>
            {({ props }) => (
              <TextInput
                aria-labelledby={`query-bar-option-input-${queryOption}-label`}
                id={id}
                data-testid="query-bar-option-input"
                className={cx(
                  darkMode
                    ? numericTextInputDarkStyles
                    : numericTextInputLightStyles,
                  hasError && optionInputWithErrorStyles
                )}
                type="text"
                sizeVariant="small"
                state={hasError ? 'error' : 'none'}
                value={`${value}`}
                onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
                  onChange(evt.target.value)
                }
                placeholder={placeholder}
                {...props}
              />
            )}
          </WithOptionDefinitionTextInputProps>
        )}
      </div>
    </div>
  );
};

const QueryOption = withTheme(UnthemedQueryOption);

export { QueryOption };
