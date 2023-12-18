import type AppRegistry from 'hadron-app-registry';
import React, { useCallback, useMemo, useRef } from 'react';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
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
} from '@mongodb-js/compass-components';
import type { MenuAction, Signal } from '@mongodb-js/compass-components';
import { ViewSwitcher } from './view-switcher';
import type { DocumentView } from '../stores/crud-store';
import { AddDataMenu } from './add-data-menu';
import { usePreference } from 'compass-preferences-model';
import UpdateMenu from './update-data-menu';
import DeleteMenu from './delete-data-menu';

const { track } = createLoggerAndTelemetry('COMPASS-CRUD-UI');

const crudQueryBarStyles = css({
  width: '100%',
  position: 'relative',
});

const crudToolbarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[3],
  padding: spacing[3],
});

const crudBarStyles = css({
  width: '100%',
  display: 'flex',
  gap: spacing[2],
  justifyContent: 'space-between',
});

const toolbarLeftActionStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const toolbarRightActionStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const exportCollectionButtonStyles = css({
  whiteSpace: 'nowrap',
});

type ExportDataOption = 'export-query' | 'export-full-collection';
const exportDataActions: MenuAction<ExportDataOption>[] = [
  { action: 'export-query', label: 'Export query results' },
  { action: 'export-full-collection', label: 'Export the full collection' },
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
  isExportable: boolean;
  isWritable: boolean;
  loadingCount: boolean;
  localAppRegistry: Pick<AppRegistry, 'getRole' | 'getStore'>;
  onApplyClicked: () => void;
  onResetClicked: () => void;
  onUpdateButtonClicked: () => void;
  onDeleteButtonClicked: () => void;
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
};

const CrudToolbar: React.FunctionComponent<CrudToolbarProps> = ({
  activeDocumentView,
  count,
  end,
  error,
  getPage,
  insertDataHandler,
  instanceDescription,
  isExportable,
  isWritable,
  loadingCount,
  localAppRegistry,
  onApplyClicked,
  onResetClicked,
  onUpdateButtonClicked,
  onDeleteButtonClicked,
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
}) => {
  const queryBarRole = localAppRegistry.getRole('Query.QueryBar')![0];

  const queryBarRef = useRef(
    isExportable
      ? {
          component: queryBarRole.component,
          store: localAppRegistry.getStore(queryBarRole.storeName!),
        }
      : null
  );

  const displayedDocumentCount = useMemo(
    () => (loadingCount ? '' : `${count ?? 'N/A'}`),
    [loadingCount, count]
  );

  const onClickRefreshDocuments = useCallback(() => {
    track('Query Results Refreshed');
    refreshDocuments();
  }, [refreshDocuments]);

  const QueryBarComponent = isExportable
    ? queryBarRef.current!.component
    : null;

  const prevButtonDisabled = useMemo(() => page === 0, [page]);
  const nextButtonDisabled = useMemo(
    // If we don't know the count, we can't know if there are more pages.
    () =>
      count === undefined || count === null ? false : 20 * (page + 1) >= count,
    [count, page]
  );

  const enableExplainPlan = usePreference('enableExplainPlan', React);
  const shouldDisableBulkOp = useMemo(
    () => querySkip || queryLimit,
    [querySkip, queryLimit]
  );

  return (
    <div className={crudToolbarStyles}>
      <div className={crudQueryBarStyles}>
        {isExportable && QueryBarComponent && (
          <QueryBarComponent
            store={queryBarRef.current!.store}
            // TODO(COMPASS-6606): add the same for other query bars
            resultId={resultId}
            buttonLabel="Find"
            onApply={onApplyClicked}
            onReset={onResetClicked}
            showExplainButton={enableExplainPlan}
            insights={insights}
          />
        )}
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
          />
          {!readonly && (
            <UpdateMenu
              isWritable={isWritable && !shouldDisableBulkOp}
              disabledTooltip="Remove limit and skip in your query to perform an update"
              onClick={onUpdateButtonClicked}
            ></UpdateMenu>
          )}
          {!readonly && (
            <DeleteMenu
              isWritable={isWritable && !shouldDisableBulkOp}
              disabledTooltip="Remove limit and skip in your query to perform a delete"
              onClick={onDeleteButtonClicked}
            ></DeleteMenu>
          )}
        </div>
        <div className={toolbarRightActionStyles}>
          <Body data-testid="crud-document-count-display">
            {start} – {end}{' '}
            {displayedDocumentCount && `of ${displayedDocumentCount}`}
          </Body>
          {loadingCount && (
            <SpinLoader size="12px" title="Fetching document count…" />
          )}
          {!loadingCount && (
            <IconButton
              aria-label="Refresh documents"
              title="Refresh documents"
              data-testid="refresh-documents-button"
              onClick={onClickRefreshDocuments}
            >
              <Icon glyph="Refresh" />
            </IconButton>
          )}

          <div>
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
