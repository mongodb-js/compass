import React from 'react';
import type { Sort } from 'mongodb';
import { toJSString } from 'mongodb-query-parser';
import { css, spacing } from '@mongodb-js/compass-components';
import type {
  QueryOption,
  QueryBarRowLayout,
} from '../constants/query-option-definition';
import QueryOptionComponent from './query-option';
import type { QueryProperty } from '../constants/query-properties';

const rowStyles = css({
  alignItems: 'flex-start',
  display: 'flex',
  flexGrow: 1,
  position: 'relative',
  gap: spacing[2],
});

type QueryBarRowProps = {
  queryOptionsLayout: QueryBarRowLayout;
  onApply?(): void;
  placeholders?: Record<QueryProperty, string>;
  disabled?: boolean;
  defaultSort: Sort;
};

export const QueryBarRow: React.FunctionComponent<QueryBarRowProps> = ({
  queryOptionsLayout,
  onApply,
  placeholders,
  disabled,
  defaultSort,
}) => {
  const getPlaceholder = (name: QueryOption): string | undefined => {
    if (name === 'sort') {
      return toJSString(defaultSort)?.replace(/\s+/gm, ' ');
    }
    return placeholders?.[name];
  };

  return (
    <div className={rowStyles}>
      {typeof queryOptionsLayout === 'string' ? (
        <QueryOptionComponent
          key={queryOptionsLayout}
          name={queryOptionsLayout}
          id={`query-bar-option-input-${queryOptionsLayout}`}
          onApply={onApply}
          placeholder={getPlaceholder(queryOptionsLayout)}
          disabled={disabled}
        />
      ) : (
        queryOptionsLayout.map((optionName: QueryOption) => (
          <QueryOptionComponent
            key={optionName}
            name={optionName}
            id={`query-bar-option-input-${optionName}`}
            onApply={onApply}
            placeholder={getPlaceholder(optionName)}
            disabled={disabled}
          />
        ))
      )}
    </div>
  );
};
