import React from 'react';
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
  gap: spacing[200],
});

type QueryBarRowProps = {
  queryOptionsLayout: QueryBarRowLayout;
  onApply?(): void;
  placeholders?: Record<QueryProperty, string>;
  disabled?: boolean;
};

export const QueryBarRow: React.FunctionComponent<QueryBarRowProps> = ({
  queryOptionsLayout,
  onApply,
  placeholders,
  disabled,
}) => {
  return (
    <div className={rowStyles}>
      {typeof queryOptionsLayout === 'string' ? (
        <QueryOptionComponent
          key={queryOptionsLayout}
          name={queryOptionsLayout}
          id={`query-bar-option-input-${queryOptionsLayout}`}
          onApply={onApply}
          placeholder={placeholders?.[queryOptionsLayout]}
          disabled={disabled}
        />
      ) : (
        queryOptionsLayout.map((optionName: QueryOption) => (
          <QueryOptionComponent
            key={optionName}
            name={optionName}
            id={`query-bar-option-input-${optionName}`}
            onApply={onApply}
            placeholder={placeholders?.[optionName]}
            disabled={disabled}
          />
        ))
      )}
    </div>
  );
};
