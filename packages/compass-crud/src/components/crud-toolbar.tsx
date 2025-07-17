import React, { useCallback, useMemo } from 'react';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import {
  Body,
  DropdownMenuButton,
  Icon,
  IconButton,
  SpinLoader,
  css,
  spacing,
  WarningSummary,
  ErrorSummary,
  Select,
  Option,
  SignalPopover,
  useContextMenuItems,
} from '@mongodb-js/compass-components';
import type { MenuAction, Signal } from '@mongodb-js/compass-components';
import { ViewSwitcher } from './view-switcher';
import type { DocumentView } from '../stores/crud-store';
import { AddDataMenu } from './add-data-menu';
import { usePreference } from 'compass-preferences-model/provider';
import UpdateMenu from './update-data-menu';
import DeleteMenu from './delete-data-menu';
import { QueryBar } from '@mongodb-js/compass-query-bar';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import { DOCUMENT_NARROW_ICON_BREAKPOINT } from '../constants/document-narrow-icon-breakpoint';

const crudQueryBarStyles = css({
  width: '100%',
  position: 'relative',
});

const crudToolbarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[300],
  padding: spacing[400],
});

const crudBarStyles = css({
  width: '100%',
  display: 'flex',
  gap: spacing[200],
  justifyContent: 'space-between',
});

const toolbarLeftActionStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const toolbarRightActionStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const prevNextStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const exportCollectionButtonStyles = css({
  whiteSpace: 'nowrap',
});

const outputOptionsButtonStyles = css({
  whiteSpace: 'nowrap',
});

const docsPerPageOptionStyles = css({
  width: spacing[1600] + spacing[300],
});

type ExportDataOption = 'export-query' | 'export-full-collection';
const exportDataActions: MenuAction<ExportDataOption>[] = [
  { action: 'export-query', label: 'Export query results' },
  { action: 'export-full-collection', label: 'Export the full collection' },
];

type ExpandControlsOption = 'expand-all' | 'collapse-all';
const expandControlsOptions: MenuAction<ExpandControlsOption>[] = [
  { action: 'expand-all', label: 'Expand all documents' },
  { action: 'collapse-all', label: 'Collapse all documents' },
];

const OUTDATED_WARNING = `The content is outdated and no longer in sync
with the current query. Press "Find" again to see the results for
the current query.`;

// From https://github.com/mongodb/mongo/blob/master/src/mongo/base/error_codes.yml#L86
const ERROR_CODE_OPERATION_TIMED_OUT = 50;

const INCREASE_MAX_TIME_MS_HINT =
  'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the expanded filter options.';

type ErrorWithPossibleCode = Error & {
  code?: {
    value: number;
  };
};

function isOperationTimedOutError(err: ErrorWithPossibleCode) {
  return (
    err.name === 'MongoServerError' &&
    err.code?.value === ERROR_CODE_OPERATION_TIMED_OUT
  );
}

export type CrudToolbarProps = {
  activeDocumentView: DocumentView;
  count?: number;
  end: number;
  error?: ErrorWithPossibleCode | null;
  getPage: (page: number) => void;
  insertDataHandler: (openInsertKey: 'insert-document' | 'import-file') => void;
  instanceDescription: string;
  isWritable: boolean;
  isFetching: boolean;
  loadingCount: boolean;
  onApplyClicked: () => void;
  onResetClicked: () => void;
  onUpdateButtonClicked: () => void;
  onDeleteButtonClicked: () => void;
  onExpandAllClicked: () => void;
  onCollapseAllClicked: () => void;
  openExportFileDialog: (exportFullCollection?: boolean) => void;
  outdated: boolean;
  page: number;
  readonly: boolean;
  refreshDocuments: () => void;
  resultId: string;
  start: number;
  viewSwitchHandler: (view: DocumentView) => void;
  insights?: Signal;
  queryLimit?: number;
  querySkip?: number;
  docsPerPage: number;
  updateMaxDocumentsPerPage: (docsPerPage: number) => void;
};

const CrudToolbar: React.FunctionComponent<CrudToolbarProps> = ({
  activeDocumentView,
  count,
  end,
  error,
  getPage,
  insertDataHandler,
  instanceDescription,
  isWritable,
  isFetching,
  loadingCount,
  onApplyClicked,
  onResetClicked,
  onUpdateButtonClicked,
  onDeleteButtonClicked,
  onExpandAllClicked,
  onCollapseAllClicked,
  openExportFileDialog,
  outdated,
  page,
  readonly,
  refreshDocuments,
  resultId,
  start,
  viewSwitchHandler,
  insights,
  queryLimit,
  querySkip,
  docsPerPage,
  updateMaxDocumentsPerPage,
}) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const isImportExportEnabled = usePreference('enableImportExport');

  const displayedDocumentCount = useMemo(
    () => (loadingCount ? '' : `${count ?? 'N/A'}`),
    [loadingCount, count]
  );

  const onClickRefreshDocuments = useCallback(() => {
    track('Query Results Refreshed', {}, connectionInfoRef.current);
    refreshDocuments();
  }, [refreshDocuments, track, connectionInfoRef]);

  const prevButtonDisabled = useMemo(() => page === 0, [page]);
  const nextButtonDisabled = useMemo(
    // If we don't know the count, we can't know if there are more pages.
    () =>
      count === undefined || count === null
        ? false
        : docsPerPage * (page + 1) >= count,
    [count, page, docsPerPage]
  );

  const enableExplainPlan = usePreference('enableExplainPlan');
  const shouldDisableBulkOp = useMemo(
    () => querySkip || queryLimit,
    [querySkip, queryLimit]
  );

  const contextMenuRef = useContextMenuItems(
    () => [
      {
        label: 'Expand all documents',
        onAction: () => {
          onExpandAllClicked();
        },
      },
      {
        label: 'Collapse all documents',
        onAction: () => {
          onCollapseAllClicked();
        },
      },
      ...(isImportExportEnabled
        ? [
            {
              label: 'Import JSON or CSV file',
              onAction: () => {
                insertDataHandler('import-file');
              },
            },
          ]
        : []),
      ...(!readonly
        ? [
            {
              label: 'Insert document...',
              onAction: () => {
                insertDataHandler('insert-document');
              },
            },
          ]
        : []),
      ...(isImportExportEnabled
        ? [
            {
              label: 'Export query results...',
              onAction: () => {
                openExportFileDialog(false);
              },
            },
            {
              label: 'Export full collection...',
              onAction: () => {
                openExportFileDialog(true);
              },
            },
          ]
        : []),
      ...(!readonly && isWritable && !shouldDisableBulkOp
        ? [
            {
              label: 'Bulk update',
              onAction: () => {
                onUpdateButtonClicked();
              },
            },
            {
              label: 'Bulk delete',
              onAction: () => {
                onDeleteButtonClicked();
              },
            },
          ]
        : []),
      {
        label: 'Refresh',
        onAction: () => {
          onClickRefreshDocuments();
        },
      },
    ],
    [
      isImportExportEnabled,
      readonly,
      isWritable,
      shouldDisableBulkOp,
      onCollapseAllClicked,
      onExpandAllClicked,
      insertDataHandler,
      openExportFileDialog,
      onUpdateButtonClicked,
      onDeleteButtonClicked,
      onClickRefreshDocuments,
    ]
  );

  return (
    <div className={crudToolbarStyles} ref={contextMenuRef}>
      <div className={crudQueryBarStyles}>
        <QueryBar
          source="crud"
          resultId={resultId}
          buttonLabel="Find"
          onApply={onApplyClicked}
          onReset={onResetClicked}
          showExplainButton={enableExplainPlan}
        />
      </div>
      <div className={crudBarStyles}>
        <div className={toolbarLeftActionStyles}>
          {!readonly && (
            <AddDataMenu
              insertDataHandler={insertDataHandler}
              isWritable={isWritable}
              instanceDescription={instanceDescription}
            />
          )}
          {isImportExportEnabled && (
            <DropdownMenuButton<ExportDataOption>
              data-testid="crud-export-collection"
              actions={exportDataActions}
              onAction={(action: ExportDataOption) =>
                openExportFileDialog(action === 'export-full-collection')
              }
              buttonText="Export Data"
              buttonProps={{
                className: exportCollectionButtonStyles,
                size: 'xsmall',
                leftGlyph: <Icon glyph="Export" />,
              }}
              narrowBreakpoint={DOCUMENT_NARROW_ICON_BREAKPOINT}
            />
          )}
          {!readonly && (
            <UpdateMenu
              isWritable={isWritable && !shouldDisableBulkOp}
              disabledTooltip={
                isWritable
                  ? 'Remove limit and skip in your query to perform an update'
                  : instanceDescription
              }
              onClick={onUpdateButtonClicked}
            ></UpdateMenu>
          )}
          {!readonly && (
            <DeleteMenu
              isWritable={isWritable && !shouldDisableBulkOp}
              disabledTooltip={
                isWritable
                  ? 'Remove limit and skip in your query to perform a delete'
                  : instanceDescription
              }
              onClick={onDeleteButtonClicked}
            ></DeleteMenu>
          )}
          {insights && <SignalPopover signals={insights} />}
        </div>
        <div className={toolbarRightActionStyles}>
          <Select
            size="xsmall"
            disabled={isFetching}
            allowDeselect={false}
            dropdownWidthBasis="option"
            aria-label="Update number of documents per page"
            value={`${docsPerPage}`}
            onChange={(value: string) =>
              updateMaxDocumentsPerPage(parseInt(value))
            }
          >
            {['25', '50', '75', '100'].map((value) => (
              <Option
                className={docsPerPageOptionStyles}
                key={value}
                value={value}
              >
                {value}
              </Option>
            ))}
          </Select>
          <Body data-testid="crud-document-count-display">
            {start} – {end}{' '}
            {displayedDocumentCount && `of ${displayedDocumentCount}`}
          </Body>
          {loadingCount && (
            <SpinLoader size="12px" title="Fetching document count…" />
          )}
          {!loadingCount && !isFetching && (
            <IconButton
              aria-label="Refresh documents"
              title="Refresh documents"
              data-testid="refresh-documents-button"
              onClick={onClickRefreshDocuments}
            >
              <Icon glyph="Refresh" />
            </IconButton>
          )}

          <div className={prevNextStyles}>
            <IconButton
              data-testid="docs-toolbar-prev-page-btn"
              aria-label="Previous Page"
              title="Previous Page"
              onClick={() => getPage(page - 1)}
              disabled={prevButtonDisabled}
            >
              <Icon glyph="ChevronLeft" />
            </IconButton>
            <IconButton
              data-testid="docs-toolbar-next-page-btn"
              aria-label="Next Page"
              title="Next Page"
              onClick={() => getPage(page + 1)}
              disabled={nextButtonDisabled}
            >
              <Icon glyph="ChevronRight" />
            </IconButton>
          </div>

          <DropdownMenuButton<ExpandControlsOption>
            data-testid="crud-export-collection"
            actions={expandControlsOptions}
            onAction={(action: ExpandControlsOption) =>
              action === 'expand-all'
                ? onExpandAllClicked()
                : onCollapseAllClicked()
            }
            buttonText=""
            buttonProps={{
              className: outputOptionsButtonStyles,
              size: 'xsmall',
              title: 'Output Options',
              ['aria-label']: 'Output Options',
              disabled: activeDocumentView === 'Table',
            }}
          />

          <ViewSwitcher
            activeView={activeDocumentView}
            onChange={viewSwitchHandler}
          />
        </div>
      </div>
      {error && (
        <ErrorSummary
          data-testid="document-list-error-summary"
          errors={
            isOperationTimedOutError(error)
              ? INCREASE_MAX_TIME_MS_HINT
              : error.message
          }
        />
      )}
      {outdated && !error && (
        <WarningSummary
          data-testid="crud-outdated-message-id"
          warnings={[OUTDATED_WARNING]}
        />
      )}
    </div>
  );
};

export { CrudToolbar };
