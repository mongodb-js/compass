import React, { useMemo } from 'react';
import { Link, css, spacing } from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';

import type {
  QueryOption,
  QueryBarOptionProps,
} from '../constants/query-option-definition';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import { QueryOption as QueryOptionComponent } from './query-option';

const gridStyles = css({
  alignItems: 'center',
  display: 'grid',
  flexGrow: 1,
  position: 'relative',
  margin: `0 ${spacing[1]}px`,
  marginTop: spacing[1],
  padding: `0 ${spacing[2]}px`,
  gap: `${spacing[1]}px ${spacing[3]}px`,
});

const docsLinkContainerStyles = css({
  gridArea: 'docsLink',
  paddingRight: spacing[2],
  minWidth: 'max-content', // Don't let the link collapse to two lines.
  textAlign: 'right',
});

const queryDocsLinkStyles = css({
  flexShrink: 0,
});

export function getGridTemplateForQueryOptions(
  queryOptions: QueryOption[]
): string {
  const documentEditorOptionsToDisplay = Object.keys(OPTION_DEFINITION).filter(
    (queryOption: string) =>
      queryOption !== 'filter' &&
      OPTION_DEFINITION[queryOption as QueryOption].type === 'document' &&
      queryOptions.includes(queryOption as QueryOption)
  ) as QueryOption[];

  const numericEditorOptionsToDisplay = Object.keys(OPTION_DEFINITION).filter(
    (queryOption: string) =>
      OPTION_DEFINITION[queryOption as QueryOption].type === 'numeric' &&
      queryOptions.includes(queryOption as QueryOption)
  ) as QueryOption[];

  const documentEditorCount = documentEditorOptionsToDisplay.length;
  const numericEditorCount = numericEditorOptionsToDisplay.length;

  if (documentEditorCount === 0) {
    // One row, all numeric editors.
    return `'${numericEditorOptionsToDisplay.join(' ')} docsLink'`;
  } else if (documentEditorCount === 1) {
    if (numericEditorCount > 0) {
      return `
  '${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]}'
  'empty empty skip limit maxTimeMS docsLink'
`;
    }

    // One row, only a document editor.
    return `
  '${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} docsLink'
`;
  } else if (documentEditorCount === 2) {
    // Two rows, document editors and numeric editors.
    if (numericEditorCount > 0) {
      return `
  '${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[1]} ${documentEditorOptionsToDisplay[1]} ${documentEditorOptionsToDisplay[1]}'
  'empty empty skip limit maxTimeMS docsLink'
`;
    }

    // No numeric editors, just document editors.
    return `
  '${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]} ${documentEditorOptionsToDisplay[0]}'
  '${documentEditorOptionsToDisplay[1]} ${documentEditorOptionsToDisplay[1]} ${documentEditorOptionsToDisplay[1]} ${documentEditorOptionsToDisplay[1]} ${documentEditorOptionsToDisplay[1]} docsLink'
`;
  }

  return `
  'project project project sort sort sort'
  'collation collation skip limit maxTimeMS docsLink'
`;
}

type QueryOptionsGridProps = {
  queryOptions: QueryOption[];
  onApply: () => void;
  onChangeQueryOption: (queryOption: QueryOption, value: string) => void;
  queryOptionProps: QueryBarOptionProps;
  refreshEditorAction: Listenable;
  schemaFields: string[];
  serverVersion: string;
};

export const QueryOptionsGrid: React.FunctionComponent<QueryOptionsGridProps> =
  ({
    queryOptions,
    onApply,
    onChangeQueryOption,
    queryOptionProps,
    refreshEditorAction,
    schemaFields,
    serverVersion,
  }) => {
    const gridTemplateAreas = useMemo(
      () => getGridTemplateForQueryOptions(queryOptions),
      [queryOptions]
    );

    return (
      <div
        className={gridStyles}
        style={{
          gridTemplateAreas,
        }}
      >
        {queryOptions.map((optionName: QueryOption) => (
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
        ))}
        <div className={docsLinkContainerStyles}>
          <Link
            className={queryDocsLinkStyles}
            href="https://docs.mongodb.com/compass/current/query/filter/"
            target="_blank"
          >
            Learn more
          </Link>
        </div>
      </div>
    );
  };
