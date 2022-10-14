import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';

import type {
  QueryOption,
  QueryBarRowLayout,
  QueryBarOptionProps,
} from '../constants/query-option-definition';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import { QueryOption as QueryOptionComponent } from './query-option';
import type { CompletionWithServerInfo } from '@mongodb-js/compass-editor/dist/types';

const rowStyles = css({
  alignItems: 'flex-start',
  display: 'flex',
  flexGrow: 1,
  position: 'relative',
  gap: spacing[2],
});

type QueryBarRowProps = {
  queryOptionsLayout: QueryBarRowLayout;
  onApply: () => void;
  onChangeQueryOption: (queryOption: QueryOption, value: string) => void;
  queryOptionProps: QueryBarOptionProps;
  refreshEditorAction: Listenable;
  schemaFields: CompletionWithServerInfo[];
  serverVersion: string;
};

export const QueryBarRow: React.FunctionComponent<QueryBarRowProps> = ({
  queryOptionsLayout,
  onApply,
  onChangeQueryOption,
  queryOptionProps,
  refreshEditorAction,
  schemaFields,
  serverVersion,
}) => {
  return (
    <div className={rowStyles}>
      {typeof queryOptionsLayout === 'string' ? (
        <QueryOptionComponent
          hasError={!queryOptionProps[`${queryOptionsLayout}Valid`]}
          key={`query-option-${queryOptionsLayout}`}
          queryOption={queryOptionsLayout}
          onChange={(value: string) =>
            onChangeQueryOption(queryOptionsLayout, value)
          }
          onApply={onApply}
          placeholder={
            queryOptionProps[`${queryOptionsLayout}Placeholder`] ||
            OPTION_DEFINITION[queryOptionsLayout].placeholder
          }
          id={`query-bar-option-input-${queryOptionsLayout}`}
          refreshEditorAction={refreshEditorAction}
          schemaFields={schemaFields}
          serverVersion={serverVersion}
          value={queryOptionProps[`${queryOptionsLayout}String`]}
        />
      ) : (
        queryOptionsLayout.map((optionName: QueryOption) => (
          <QueryOptionComponent
            hasError={!queryOptionProps[`${optionName}Valid`]}
            key={`query-option-${optionName}`}
            queryOption={optionName}
            onChange={(value: string) => onChangeQueryOption(optionName, value)}
            onApply={onApply}
            placeholder={
              queryOptionProps[`${optionName}Placeholder`] ||
              OPTION_DEFINITION[optionName].placeholder
            }
            id={`query-bar-option-input-${optionName}`}
            refreshEditorAction={refreshEditorAction}
            schemaFields={schemaFields}
            serverVersion={serverVersion}
            value={queryOptionProps[`${optionName}String`]}
          />
        ))
      )}
    </div>
  );
};
