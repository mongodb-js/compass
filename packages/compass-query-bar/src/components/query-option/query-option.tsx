import React, { useMemo } from 'react';
import {
  Label,
  TextInput,
  css,
  cx,
  focusRingStyles,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';

import { OptionEditor } from '../option-editor/option-editor';
import { OPTION_DEFINITION } from '../../constants/query-option-definition';
import type { QueryOption as QueryOptionType } from '../../constants/query-option-definition';

const queryOptionStyles = css({
  display: 'flex',
  width: '100%',
  position: 'relative',
  alignItems: 'center',
});

const autocompleteOptionStyles = css({
  flexGrow: 1,
});

const numericOptionStyles = css({
  flexBasis: spacing[7] * 5,
});

const queryOptionLabelStyles = css({
  // A bit of vertical padding so users can click the label easier.
  padding: `${spacing[2]}px 0`,
});

const autocompleteOptionInputStyles = css(
  {
    display: 'flex',
    flexGrow: 1,
  },
  focusRingStyles
);

const numericTextInputStyles = css({
  input: {
    borderColor: 'transparent',
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
  marginRight: spacing[2],
});

type QueryOptionProps = {
  autoPopulated: boolean;
  hasError: boolean;
  onChange: (value: string) => void;
  onApply: () => void;
  placeholder?: string;
  queryOption: QueryOptionType;
  refreshEditorAction: Listenable;
  schemaFields: string[];
  serverVersion: string;
  value?: string | number;
};

const QueryOption: React.FunctionComponent<QueryOptionProps> = ({
  autoPopulated,
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
  const isAutoCompleteInput = useMemo(
    () => OPTION_DEFINITION[queryOption].type === 'document',
    [queryOption]
  );

  return (
    <div
      className={cx(
        queryOptionStyles,
        isAutoCompleteInput ? autocompleteOptionStyles : numericOptionStyles
      )}
      data-test-id="query-bar-option"
    >
      <div
        className={queryOptionLabelContainerStyles}
        data-test-id="query-bar-option-label"
      >
        <Label
          htmlFor={`query-bar-option-input-${queryOption}`}
          id={`query-bar-option-input-${queryOption}-label`}
          className={queryOptionLabelStyles}
        >
          {queryOption}
        </Label>
      </div>
      <div className={cx(isAutoCompleteInput && autocompleteOptionInputStyles)}>
        {isAutoCompleteInput ? (
          <OptionEditor
            autoPopulated={autoPopulated}
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
            data-test-id="query-bar-option-input"
            className={cx(
              numericTextInputStyles,
              hasError && optionInputWithErrorStyles
            )}
            type="text"
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

export { QueryOption };
