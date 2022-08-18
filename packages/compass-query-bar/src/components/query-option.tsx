import React, { useMemo } from 'react';
import {
  Label,
  TextInput,
  css,
  cx,
  focusRingStyles,
  spacing,
  uiColors,
  withTheme,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';

import { OptionEditor } from './option-editor';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import type { QueryOption as QueryOptionType } from '../constants/query-option-definition';

const queryOptionStyles = css({
  display: 'flex',
  position: 'relative',
  alignItems: 'center',
});

const queryOptionLabelStyles = css({
  // A bit of vertical padding so users can click the label easier.
  padding: `${spacing[2]}px 0`,
  marginRight: spacing[2],
});

const documentEditorOptionStyles = css(
  {
    minWidth: spacing[7],
    display: 'flex',
    flexGrow: 1,
  },
  focusRingStyles
);

const numericTextInputLightStyles = css({
  input: {
    // TODO: Decide border styles for query bar editors.
    // Remove these commented styles if we want borders.
    // borderColor: 'transparent',
    borderColor: uiColors.gray.light2,
  },
});

const numericTextInputDarkStyles = css({
  input: {
    // TODO: Decide border styles for query bar editors.
    // Remove these commented styles if we want borders.
    // borderColor: 'transparent',
    borderColor: uiColors.gray.base,
  },
});

const optionInputWithErrorStyles = css({
  input: {
    borderColor: uiColors.red.base,
  },
});

const queryOptionLabelContainerStyles = css({
  whiteSpace: 'nowrap',
  textTransform: 'capitalize',
  alignItems: 'center',
  display: 'flex',
  margin: 0,
});

type QueryOptionProps = {
  darkMode?: boolean;
  hasError: boolean;
  onChange: (value: string) => void;
  onApply: () => void;
  placeholder?: string;
  queryOption: QueryOptionType;
  refreshEditorAction: Listenable;
  schemaFields: string[];
  serverVersion: string;
  value?: string;
};

const UnthemedQueryOption: React.FunctionComponent<QueryOptionProps> = ({
  darkMode,
  hasError,
  onApply,
  onChange,
  placeholder = '',
  queryOption,
  refreshEditorAction,
  schemaFields = [],
  serverVersion,
  value = '',
}) => {
  const isDocumentEditor = useMemo(
    () => OPTION_DEFINITION[queryOption].type === 'document',
    [queryOption]
  );

  return (
    <div
      className={queryOptionStyles}
      data-testid={`query-bar-option-${queryOption}`}
    >
      <div
        className={queryOptionLabelContainerStyles}
        data-testid="query-bar-option-label"
      >
        <Label
          htmlFor={`query-bar-option-input-${queryOption}`}
          id={`query-bar-option-input-${queryOption}-label`}
          className={queryOptionLabelStyles}
          // We hide the `Filter` label, but keep it in the dom for
          // screen reader label support.
          hidden={queryOption === 'filter'}
        >
          {queryOption}
        </Label>
      </div>
      <div className={cx(isDocumentEditor && documentEditorOptionStyles)}>
        {isDocumentEditor ? (
          <OptionEditor
            hasError={hasError}
            id={`query-bar-option-input-${queryOption}`}
            queryOption={queryOption}
            onApply={onApply}
            onChange={onChange}
            placeholder={placeholder}
            refreshEditorAction={refreshEditorAction}
            schemaFields={schemaFields}
            serverVersion={serverVersion}
            value={value}
          />
        ) : (
          <TextInput
            aria-labelledby={`query-bar-option-input-${queryOption}-label`}
            id={`query-bar-option-input-${queryOption}`}
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
          />
        )}
      </div>
    </div>
  );
};

const QueryOption = withTheme(UnthemedQueryOption);

export { QueryOption };
