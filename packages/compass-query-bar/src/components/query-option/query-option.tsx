import React, { useMemo } from 'react';
import OptionEditor from '../option-editor';
import {
  FocusState,
  Icon,
  IconButton,
  Label,
  TextInput,
  css,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
  mergeProps,
  spacing,
  useHoverState,
  useFocusState,
  uiColors,
} from '@mongodb-js/compass-components';

import { OPTION_DEFINITION, QueryOption as QueryOptionType } from '../../constants/query-option-definition';

const queryOptionStyles = css({
  display: 'flex',
  width: '100%',
  position: 'relative',
  alignItems: 'center',
});

const autocompleteOptionStyles = cx(css({
  flexGrow: 1,

}));

const numericOptionStyles = css({
  flexBasis: spacing[7] * 5
});

const queryOptionLabelStyles = css({
  padding: 0
});

const autocompleteOptionInputStyles = css({
  display: 'flex',
  flexGrow: 1,
  border: `1px solid transparent`,
  // '&:hover': {
  //   '&::after': {
  //     boxShadow: `0 0 0 3px ${uiColors.gray.light1}`,
  //     transitionTimingFunction: 'ease-out',
  //   }
  // },
  // '&:focus-within': focusRingVisibleStyles,
}, focusRingStyles);

const autocompleteOptionInvalidStyles = css({
  borderColor: uiColors.red.base,
  '&:hover, &:focus-within': {
    '&::after': {
      boxShadow: `0 0 0 3px violet`,//`0 0 0 3px ${uiColors.red.light2}`,
      transitionTimingFunction: 'ease-out',
    }
  },
  // '&:focus-within': focusRingVisibleStyles,
});//, focusRingStyles);


const numericTextInputStyles = css({
  'input': {
    borderColor: 'transparent'
  }
});

const optionInputWithErrorStyles = css({
  'input': {
    borderColor: uiColors.red.base,
  },
})

const queryOptionLabelContainerStyles = css({
  whiteSpace: 'nowrap',
  textTransform: 'capitalize',
  alignItems: 'center',
  display: 'flex',
  // margin: `0 ${spacing[2]}px`,
  margin: 0,
  marginRight: spacing[2],
});

type QueryOptionProps = {
  autoPopulated: boolean;
  hasError: boolean;
  onChange: (evt: React.ChangeEvent<HTMLInputElement>) => void;
  onApply: () => void;
  placeholder?: string;
  queryOption: QueryOptionType;
  refreshEditorAction: () => void;
  schemaFields: string[];  serverVersion: string;
  value?: string | number;
};

function QueryOption({
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
}: QueryOptionProps) {

  const link = useMemo(
    () => OPTION_DEFINITION[queryOption].link
  , [ queryOption ]);

  const isAutoCompleteInput = useMemo(
    () => OPTION_DEFINITION[queryOption].type === 'document'
  , [ queryOption ]);

  // const [hoverProps, isHovered] = useHoverState();
  // const [focusProps, focusState] = useFocusState();

  // const isFocused = useMemo(
  //   () => focusState === FocusState.FocusVisible,
  //   [focusState]
  // );

  // const isFocusedWithin = useMemo(
  //   () => focusState === FocusState.FocusWithinVisible,
  //   [focusState]
  // );

  // const queryOptionProps = mergeProps<HTMLDivElement>(
  //   focusProps,
  //   hoverProps
  // );

  console.log('QueryOption', queryOption, hasError);

  return (
    <div
      className={cx(
        queryOptionStyles,
        isAutoCompleteInput ? autocompleteOptionStyles : numericOptionStyles,
        // isHovered && css({ color: 'red !important' }),
        // (isFocusedWithin || isFocused) && css({ borderColor: 'purple !important', border: '3px solid purple !important' }),
      )}
      data-test-id="query-bar-option"
      // {...queryOptionProps}
    >
      <div className={queryOptionLabelContainerStyles} data-test-id="query-bar-option-label">
        {/* <IconButton
          aria-label={`More information on ${queryOption}`}
          href={link}
          target="_blank"
        >
          <Icon glyph="InfoWithCircle" size="small"/>
        </IconButton> */}
        <Label
          htmlFor={`querybar-option-input-${queryOption}`}
          id={`querybar-option-input-${queryOption}-label`}
          className={queryOptionLabelStyles}
        >
          {queryOption}
        </Label>
      </div>
      <div
        className={cx(
          // queryOptionStyles,
          isAutoCompleteInput && autocompleteOptionInputStyles,// : numericOptionStyles,
          

          // isHovered && css({ color: 'red !important' }),
          // (isFocusedWithin || isFocused) && css({ borderColor: 'purple !important', border: '3px solid purple !important' }),
        )}
      >
        {isAutoCompleteInput
          ? (
            <OptionEditor
              autoPopulated={autoPopulated}
              hasError={hasError}
              id={`querybar-option-input-${queryOption}`}
              label={queryOption}
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
              aria-labelledby={`querybar-option-input-${queryOption}-label`}
              id={`querybar-option-input-${queryOption}`}
              data-test-id="query-bar-option-input"
              className={cx(numericTextInputStyles, hasError && optionInputWithErrorStyles)}
              type="text"
              value={`${value}`}
              onChange={onChange}
              placeholder={placeholder}
            />
          )}
        </div>
    </div>
  );
}

export { QueryOption };
