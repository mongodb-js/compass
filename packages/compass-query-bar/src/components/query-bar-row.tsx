import React from 'react';
import {
  Link,
  css,
  cx,
  spacing,
  breakpoints,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';

import type {
  QueryOption,
  QueryBarRowLayout,
  QueryBarOptionProps,
} from '../constants/query-option-definition';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import { QueryOption as QueryOptionComponent } from './query-option';

const rowStyles = css({
  alignItems: 'center',
  display: 'grid',
  flexGrow: 1,
  position: 'relative',
  margin: spacing[1],
  padding: `0 ${spacing[2]}px`,
  gap: `0 ${spacing[3]}px`,
  gridTemplateColumns: '50% repeat(auto-fit, minmax(150px, 1fr))',
});

const firstQueryOptionsRowStyles = css({
  margin: `${spacing[1]}px 0px`,
  padding: 0,
});

const multiOptionRowStyles = css({
  [`@media (max-width: ${breakpoints.XLDesktop}px)`]: {
    // !important to override the inline gridTemplateColumns styles on
    // smaller displays or window sizes.
    gridTemplateColumns: '50% repeat(auto-fit, minmax(150px, 1fr)) !important',
  },
});

const queryDocsLinkStyles = css({
  flexShrink: 0,
  width: 'fit-content',
  marginRight: spacing[2],
});

type QueryBarRowProps = {
  isFirstRow: boolean;
  isLastRow: boolean;
  layout: QueryBarRowLayout;
  onApply: () => void;
  onChangeQueryOption: (queryOption: QueryOption, value: string) => void;
  queryOptionProps: QueryBarOptionProps;
  refreshEditorAction: Listenable;
  schemaFields: string[];
  serverVersion: string;
};

export const QueryBarRow: React.FunctionComponent<QueryBarRowProps> = ({
  isFirstRow,
  isLastRow,
  layout,
  onApply,
  onChangeQueryOption,
  queryOptionProps,
  refreshEditorAction,
  schemaFields,
  serverVersion,
}) => {
  const isSingleOptionRow = typeof layout === 'string';

  return (
    <div
      className={cx(
        rowStyles,
        isFirstRow && firstQueryOptionsRowStyles,
        !isSingleOptionRow && multiOptionRowStyles
      )}
      style={
        isSingleOptionRow
          ? {
              // Cloud has a instances where the last row is a single option row.
              gridTemplateColumns: `1fr${isLastRow ? ' max-content' : ''}`,
            }
          : {
              gridTemplateColumns: `50% repeat(${layout.length - 1}, 1fr)${
                isLastRow ? ' max-content' : ''
              }`,
            }
      }
    >
      {isSingleOptionRow ? (
        <QueryOptionComponent
          hasError={!queryOptionProps[`${layout}Valid`]}
          key={`query-option-${layout}`}
          queryOption={layout}
          onChange={(value: string) => onChangeQueryOption(layout, value)}
          onApply={onApply}
          placeholder={
            queryOptionProps[`${layout}Placeholder`] ||
            OPTION_DEFINITION[layout].placeholder
          }
          refreshEditorAction={refreshEditorAction}
          schemaFields={schemaFields}
          serverVersion={serverVersion}
          value={queryOptionProps[`${layout}String`]}
        />
      ) : (
        layout.map((optionName: QueryOption) => (
          <QueryOptionComponent
            hasError={!queryOptionProps[`${optionName}Valid`]}
            key={`query-option-${optionName}`}
            onChange={(value: string) => onChangeQueryOption(optionName, value)}
            onApply={onApply}
            placeholder={
              queryOptionProps[`${optionName}Placeholder`] ||
              OPTION_DEFINITION[optionName].placeholder
            }
            queryOption={optionName}
            refreshEditorAction={refreshEditorAction}
            schemaFields={schemaFields}
            serverVersion={serverVersion}
            value={queryOptionProps[`${optionName}String`]}
          />
        ))
      )}
      {isLastRow && (
        <Link
          className={queryDocsLinkStyles}
          href="https://docs.mongodb.com/compass/current/query/filter/"
          target="_blank"
        >
          Learn more
        </Link>
      )}
    </div>
  );
};
