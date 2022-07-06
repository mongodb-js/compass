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
  gap: `${spacing[1]}px ${spacing[2]}px`,
});

const docsLinkContainerStyles = css({
  paddingRight: spacing[2],
  whiteSpace: 'nowrap',
  display: 'flex',
  justifyContent: 'flex-end',
  flexGrow: 1,
});

const numericEditorsGridAreaStyles = css({
  gridArea: 'rest',
  display: 'flex',
  gap: `0px ${spacing[2]}px`,
  justifyContent: 'space-between',
});

const COLUMNS = 6;

const cells = (area: string, n: number) => {
  return Array(n).fill(area).join(' ');
};

const toTemplateArea = (rows: string[]) => {
  return rows
    .filter(Boolean)
    .map((row) => `'${row}'`)
    .join('\n');
};

export function getGridTemplateForQueryOptions(
  queryOptions: QueryOption[]
): string {
  const documentEditors = Object.values(OPTION_DEFINITION).filter((opt) => {
    return (
      opt.name !== 'filter' &&
      queryOptions.includes(opt.name) &&
      opt.type === 'document'
    );
  });

  const numericEditors = Object.values(OPTION_DEFINITION).filter((opt) => {
    return queryOptions.includes(opt.name) && opt.type === 'numeric';
  });

  // If there are no document editors, numeric options and link take
  // all the space of one row.
  if (documentEditors.length === 0) {
    return toTemplateArea([cells('rest', COLUMNS)]);
  }

  // When there are no numeric options, we want link to be last cell in
  // last row.
  if (numericEditors.length === 0) {
    const lastDocumentEditor = documentEditors.pop();
    const linkRow = `${cells(lastDocumentEditor!.name, COLUMNS - 1)} rest`;
    const rows = [
      documentEditors
        // First row will have either 1 or 2 cells evenly distributed in 6
        // available columns
        .map((option) => {
          return cells(option.name, COLUMNS / documentEditors.length);
        })
        .join(' '),
      linkRow,
    ];
    return toTemplateArea(rows);
  }

  // For every other case we will do some special handling where numeric inputs
  // will take 3 to 4 cells based on the amount of inputs provided and will
  // always be on the end of the second row and document inputs adjust
  // around that.
  const numericCellsLength = numericEditors.length > 2 ? 4 : 3;
  const freeCellsLength = COLUMNS - numericCellsLength;
  const numericCells = cells('rest', numericCellsLength);

  // If there is more than two editors in total, move last one to the next row.
  if (documentEditors.length > 2) {
    const lastDocumentEditor = documentEditors.pop();
    const rows = [
      documentEditors
        .map((option) => {
          return cells(option.name, COLUMNS / documentEditors.length);
        })
        .join(' '),
      `${cells(lastDocumentEditor!.name, freeCellsLength)} ${numericCells}`,
    ];
    return toTemplateArea(rows);
  }

  // Otherwise keep numeric cells on the last row separately from document
  // editors.
  const rows = [
    documentEditors
      .map((option) => {
        return cells(option.name, COLUMNS / documentEditors.length);
      })
      .join(' '),
    `${cells('.', freeCellsLength)} ${numericCells}`,
  ];
  return toTemplateArea(rows);
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

    const documentEditors = useMemo(
      () =>
        Object.values(OPTION_DEFINITION)
          .filter((opt) => {
            return (
              opt.name !== 'filter' &&
              queryOptions.includes(opt.name) &&
              opt.type === 'document'
            );
          })
          .map((optionDefinition) => optionDefinition.name),
      [queryOptions]
    );
    const numericEditors = useMemo(
      () =>
        Object.values(OPTION_DEFINITION)
          .filter((opt) => {
            return queryOptions.includes(opt.name) && opt.type === 'numeric';
          })
          .map((optionDefinition) => optionDefinition.name),
      [queryOptions]
    );

    return (
      <div
        className={gridStyles}
        style={{
          gridTemplateAreas,
        }}
      >
        {documentEditors.map((optionName: QueryOption) => (
          <QueryOptionComponent
            gridArea={optionName}
            hasError={!queryOptionProps[`${optionName}Valid`]}
            key={`document-query-option-${optionName}`}
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
        <div className={numericEditorsGridAreaStyles}>
          {numericEditors.map((optionName: QueryOption) => (
            <QueryOptionComponent
              hasError={!queryOptionProps[`${optionName}Valid`]}
              key={`numeric-query-option-${optionName}`}
              onChange={(value: string) =>
                onChangeQueryOption(optionName, value)
              }
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
              href="https://docs.mongodb.com/compass/current/query/filter/"
              target="_blank"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    );
  };
