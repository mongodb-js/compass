import React, { useCallback, useMemo } from 'react';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

import {
  Body,
  Button,
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
  useContextMenuGroups,
  Tooltip,
  WorkspaceContainer,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { MenuAction, Signal } from '@mongodb-js/compass-components';
import { ViewSwitcher } from './view-switcher';
import { type DocumentView } from '../stores/crud-store';
import { AddDataMenu } from './add-data-menu';
import { usePreference } from 'compass-preferences-model/provider';
import { BulkActionsMenu } from './bulk-actions-menu';
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

const exportCodeButtonTextStyles = css({
  [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < ${DOCUMENT_NARROW_ICON_BREAKPOINT})`]:
    {
      display: 'none',
    },
});

const outputOptionsButtonStyles = css({
  whiteSpace: 'nowrap',
});

const docsPerPageOptionStyles = css({
  width: spacing[1600] + spacing[300],
});

const loaderContainerStyles = css({
  paddingLeft: spacing[200],
  paddingRight: spacing[200],
});

const countUnavailableTextStyles = css({
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
  textUnderlineOffset: '3px',
});

type ExportDataOption = 'export-query' | 'export-full-collection';
type ExpandControlsOption = 'expand-all' | 'collapse-all';

// From https://github.com/mongodb/mongo/blob/master/src/mongo/base/error_codes.yml#L86
const ERROR_CODE_OPERATION_TIMED_OUT = 50;

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
  isMockDataGeneratorEligible?: boolean;
  lastCountRunMaxTimeMS: number;
  loadingCount: boolean;
  onApplyClicked: () => void;
  onResetClicked: () => void;
  onUpdateButtonClicked: () => void;
  onDeleteButtonClicked: () => void;
  onExpandAllClicked: () => void;
  onCollapseAllClicked: () => void;
  openExportFileDialog: (exportFullCollection?: boolean) => void;
  onOpenExportToLanguage: () => void;
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
  isMockDataGeneratorEligible,
  lastCountRunMaxTimeMS,
  loadingCount,
  onApplyClicked,
  onResetClicked,
  onUpdateButtonClicked,
  onDeleteButtonClicked,
  onExpandAllClicked,
  onCollapseAllClicked,
  openExportFileDialog,
  onOpenExportToLanguage,
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
  const t = useTranslation();
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const exportDataActions = useMemo<MenuAction<ExportDataOption>[]>(
    () => [
      {
        action: 'export-query',
        label: t('crud.toolbar.exportQueryResults', 'Export query results'),
      },
      {
        action: 'export-full-collection',
        label: t(
          'crud.toolbar.exportFullCollection',
          'Export the full collection'
        ),
      },
    ],
    [t]
  );
  const expandControlsOptions = useMemo<MenuAction<ExpandControlsOption>[]>(
    () => [
      {
        action: 'expand-all',
        label: t('crud.toolbar.expandAllDocuments', 'Expand all documents'),
      },
      {
        action: 'collapse-all',
        label: t('crud.toolbar.collapseAllDocuments', 'Collapse all documents'),
      },
    ],
    [t]
  );
  const isImportExportEnabled = usePreference('enableImportExport');

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

  const contextMenuRef = useContextMenuGroups(
    () => [
      {
        telemetryLabel: 'Expand all documents',
        items: [
          {
            label: t('crud.toolbar.expandAllDocuments', 'Expand all documents'),
            onAction: () => {
              onExpandAllClicked();
            },
          },
          {
            label: t(
              'crud.toolbar.collapseAllDocuments',
              'Collapse all documents'
            ),
            onAction: () => {
              onCollapseAllClicked();
            },
          },
          isImportExportEnabled
            ? {
                label: t('crud.addData.importFile', 'Import JSON or CSV file'),
                onAction: () => {
                  insertDataHandler('import-file');
                },
              }
            : undefined,
          !readonly
            ? {
                label: t(
                  'crud.toolbar.insertDocumentEllipsis',
                  'Insert document...'
                ),
                onAction: () => {
                  insertDataHandler('insert-document');
                },
              }
            : undefined,
          ...(isImportExportEnabled
            ? [
                {
                  label: t(
                    'crud.toolbar.exportQueryResultsEllipsis',
                    'Export query results...'
                  ),
                  onAction: () => {
                    openExportFileDialog(false);
                  },
                },
                {
                  label: t(
                    'crud.toolbar.exportFullCollectionEllipsis',
                    'Export full collection...'
                  ),
                  onAction: () => {
                    openExportFileDialog(true);
                  },
                },
              ]
            : []),
          ...(!readonly && isWritable && !shouldDisableBulkOp
            ? [
                {
                  label: t('crud.toolbar.bulkUpdate', 'Bulk update'),
                  onAction: () => {
                    onUpdateButtonClicked();
                  },
                },
                {
                  label: t('crud.toolbar.bulkDelete', 'Bulk delete'),
                  onAction: () => {
                    onDeleteButtonClicked();
                  },
                },
              ]
            : []),
          {
            label: t('crud.toolbar.refresh', 'Refresh'),
            onAction: () => {
              onClickRefreshDocuments();
            },
          },
        ],
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
      t,
    ]
  );

  return (
    <div className={crudToolbarStyles} ref={contextMenuRef}>
      <div className={crudQueryBarStyles}>
        <QueryBar
          source="crud"
          resultId={resultId}
          buttonLabel={t('crud.toolbar.find', 'Find')}
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
              isMockDataGeneratorEligible={isMockDataGeneratorEligible}
            />
          )}
          {!readonly && (
            <BulkActionsMenu
              isWritable={isWritable && !shouldDisableBulkOp}
              disabledTooltip={
                isWritable
                  ? t(
                      'crud.toolbar.removeLimitAndSkip',
                      'Remove limit and skip in your query to perform a bulk operation'
                    )
                  : instanceDescription
              }
              onUpdate={onUpdateButtonClicked}
              onDelete={onDeleteButtonClicked}
            ></BulkActionsMenu>
          )}
          {isImportExportEnabled && (
            <DropdownMenuButton<ExportDataOption>
              data-testid="crud-export-collection"
              actions={exportDataActions}
              onAction={(action: ExportDataOption) =>
                openExportFileDialog(action === 'export-full-collection')
              }
              buttonText={t('crud.toolbar.exportData', 'Export Data')}
              buttonProps={{
                className: exportCollectionButtonStyles,
                size: 'xsmall',
                leftGlyph: <Icon glyph="Export" />,
              }}
              narrowBreakpoint={DOCUMENT_NARROW_ICON_BREAKPOINT}
            />
          )}
          <Button
            onClick={onOpenExportToLanguage}
            title={t(
              'crud.toolbar.exportToLanguage',
              'Export query to language'
            )}
            aria-label={t(
              'crud.toolbar.exportToLanguage',
              'Export query to language'
            )}
            data-testid="crud-export-to-language-button"
            className={exportCollectionButtonStyles}
            size="xsmall"
            leftGlyph={<Icon glyph="Code" />}
          >
            <span className={exportCodeButtonTextStyles}>
              {t('crud.toolbar.exportCode', 'Export Code')}
            </span>
          </Button>
          {insights && <SignalPopover signals={insights} />}
        </div>
        <div className={toolbarRightActionStyles}>
          <Select
            data-testid="crud-document-per-page-selector"
            size="xsmall"
            disabled={isFetching}
            allowDeselect={false}
            dropdownWidthBasis="option"
            aria-label={t(
              'crud.toolbar.docsPerPage',
              'Update number of documents per page'
            )}
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
            {!loadingCount && (
              <span>
                {t('crud.toolbar.of', 'of')}{' '}
                {count ?? (
                  <Tooltip
                    trigger={
                      <span
                        data-testid="crud-document-count-unavailable"
                        className={countUnavailableTextStyles}
                      >
                        {t('crud.toolbar.notAvailable', 'N/A')}
                      </span>
                    }
                  >
                    <Body>
                      {t(
                        'crud.toolbar.countUnavailable',
                        'The count is not available for this query. This can happen when the count operation fails or exceeds the maxTimeMS of {maxTimeMS}.',
                        { maxTimeMS: lastCountRunMaxTimeMS }
                      )}
                    </Body>
                  </Tooltip>
                )}
              </span>
            )}
          </Body>
          {loadingCount && (
            <div className={loaderContainerStyles}>
              <SpinLoader
                size="12px"
                title={t(
                  'crud.toolbar.fetchingCount',
                  'Fetching document count…'
                )}
              />
            </div>
          )}
          {!loadingCount && !isFetching && (
            <IconButton
              aria-label={t(
                'crud.toolbar.refreshDocuments',
                'Refresh documents'
              )}
              title={t('crud.toolbar.refreshDocuments', 'Refresh documents')}
              data-testid="refresh-documents-button"
              onClick={onClickRefreshDocuments}
            >
              <Icon glyph="Refresh" />
            </IconButton>
          )}

          <div className={prevNextStyles}>
            <IconButton
              data-testid="docs-toolbar-prev-page-btn"
              aria-label={t('crud.toolbar.previousPage', 'Previous Page')}
              title={t('crud.toolbar.previousPage', 'Previous Page')}
              onClick={() => getPage(page - 1)}
              disabled={prevButtonDisabled}
            >
              <Icon glyph="ChevronLeft" />
            </IconButton>
            <IconButton
              data-testid="docs-toolbar-next-page-btn"
              aria-label={t('crud.toolbar.nextPage', 'Next Page')}
              title={t('crud.toolbar.nextPage', 'Next Page')}
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
              title: t('crud.toolbar.outputOptions', 'Output Options'),
              ['aria-label']: t('crud.toolbar.outputOptions', 'Output Options'),
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
              ? t(
                  'crud.toolbar.increaseMaxTimeMS',
                  'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the expanded filter options.'
                )
              : error.message
          }
        />
      )}
      {outdated && !error && (
        <WarningSummary
          data-testid="crud-outdated-message-id"
          warnings={[
            t(
              'crud.toolbar.outdated',
              `The content is outdated and no longer in sync
with the current query. Press "Find" again to see the results for
the current query.`
            ),
          ]}
        />
      )}
    </div>
  );
};

export { CrudToolbar };
