import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useTelemetry,
  SkillsBannerContextEnum,
  useAtlasSkillsBanner,
} from '@mongodb-js/compass-telemetry/provider';

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
  usePersistedState,
  AtlasSkillsBanner,
  Tooltip,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import type { MenuAction, Signal } from '@mongodb-js/compass-components';
import { ViewSwitcher } from './view-switcher';
import { type DocumentView } from '../stores/crud-store';
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
  isMockDataGeneratorEligibleAndSchemaReady?: boolean;
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
  isMockDataGeneratorEligibleAndSchemaReady,
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
  const { t } = useTranslation('compassCrud');
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();

  const exportDataActions = useMemo<MenuAction<ExportDataOption>[]>(
    () => [
      { action: 'export-query', label: t('exportQueryResults') },
      { action: 'export-full-collection', label: t('exportFullCollection') },
    ],
    [t]
  );

  const expandControlsOptions = useMemo<MenuAction<ExpandControlsOption>[]>(
    () => [
      { action: 'expand-all', label: t('expandAllDocuments') },
      { action: 'collapse-all', label: t('collapseAllDocuments') },
    ],
    [t]
  );
  const isImportExportEnabled = usePreference('enableImportExport');
  const [dismissed, setDismissed] = usePersistedState(
    'mongodb_compass_dismissedAtlasDocSkillBanner',
    false
  );

  // @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
  const { shouldShowAtlasSkillsBanner } = useAtlasSkillsBanner(
    SkillsBannerContextEnum.Documents
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

  const contextMenuRef = useContextMenuGroups(
    () => [
      {
        telemetryLabel: 'Expand all documents',
        items: [
          {
            label: t('expandAllDocuments'),
            onAction: () => {
              onExpandAllClicked();
            },
          },
          {
            label: t('collapseAllDocuments'),
            onAction: () => {
              onCollapseAllClicked();
            },
          },
          isImportExportEnabled
            ? {
                label: t('contextMenuImportFile'),
                onAction: () => {
                  insertDataHandler('import-file');
                },
              }
            : undefined,
          !readonly
            ? {
                label: t('contextMenuInsertDocument'),
                onAction: () => {
                  insertDataHandler('insert-document');
                },
              }
            : undefined,
          ...(isImportExportEnabled
            ? [
                {
                  label: t('contextMenuExportQueryResults'),
                  onAction: () => {
                    openExportFileDialog(false);
                  },
                },
                {
                  label: t('contextMenuExportFullCollection'),
                  onAction: () => {
                    openExportFileDialog(true);
                  },
                },
              ]
            : []),
          ...(!readonly && isWritable && !shouldDisableBulkOp
            ? [
                {
                  label: t('contextMenuBulkUpdate'),
                  onAction: () => {
                    onUpdateButtonClicked();
                  },
                },
                {
                  label: t('contextMenuBulkDelete'),
                  onAction: () => {
                    onDeleteButtonClicked();
                  },
                },
              ]
            : []),
          {
            label: t('contextMenuRefresh'),
            onAction: () => {
              onClickRefreshDocuments();
            },
          },
        ],
      },
    ],
    [
      t,
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
          buttonLabel={t('queryBarFindButton')}
          onApply={onApplyClicked}
          onReset={onResetClicked}
          showExplainButton={enableExplainPlan}
        />
      </div>

      <AtlasSkillsBanner
        ctaText={t('atlasSkillsBannerCta')}
        skillsUrl="https://learn.mongodb.com/courses/crud-operations-in-mongodb?team=growth"
        onCloseSkillsBanner={() => {
          setDismissed(true);
          track('Atlas Skills CTA Dismissed', {
            context: 'Documents Tab',
          });
        }}
        showBanner={shouldShowAtlasSkillsBanner && !dismissed}
        onCtaClick={() => {
          track('Atlas Skills CTA Clicked', {
            context: 'Documents Tab',
          });
        }}
      />

      <div className={crudBarStyles}>
        <div className={toolbarLeftActionStyles}>
          {!readonly && (
            <AddDataMenu
              insertDataHandler={insertDataHandler}
              isWritable={isWritable}
              instanceDescription={instanceDescription}
              isMockDataGeneratorEligibleAndSchemaReady={
                isMockDataGeneratorEligibleAndSchemaReady
              }
            />
          )}
          {!readonly && (
            <UpdateMenu
              isWritable={isWritable && !shouldDisableBulkOp}
              disabledTooltip={
                isWritable
                  ? t('updateMenuDisabledTooltip')
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
                  ? t('deleteMenuDisabledTooltip')
                  : instanceDescription
              }
              onClick={onDeleteButtonClicked}
            ></DeleteMenu>
          )}
          {isImportExportEnabled && (
            <DropdownMenuButton<ExportDataOption>
              data-testid="crud-export-collection"
              actions={exportDataActions}
              onAction={(action: ExportDataOption) =>
                openExportFileDialog(action === 'export-full-collection')
              }
              buttonText={t('exportDataButton')}
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
            title={t('exportToLanguageTitle')}
            aria-label={t('exportToLanguageTitle')}
            data-testid="crud-export-to-language-button"
            className={exportCollectionButtonStyles}
            size="xsmall"
            leftGlyph={<Icon glyph="Code" />}
          >
            <span className={exportCodeButtonTextStyles}>
              {t('exportCodeButton')}
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
            aria-label={t('docsPerPageAriaLabel')}
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
                {t('countOf')}{' '}
                {count ?? (
                  <Tooltip
                    trigger={
                      <span
                        data-testid="crud-document-count-unavailable"
                        className={countUnavailableTextStyles}
                      >
                        {t('countUnavailable')}
                      </span>
                    }
                  >
                    <Body>
                      {t('countUnavailableTooltip', {
                        maxTimeMS: lastCountRunMaxTimeMS,
                      })}
                    </Body>
                  </Tooltip>
                )}
              </span>
            )}
          </Body>
          {loadingCount && (
            <div className={loaderContainerStyles}>
              <SpinLoader size="12px" title={t('fetchingDocumentCount')} />
            </div>
          )}
          {!loadingCount && !isFetching && (
            <IconButton
              aria-label={t('refreshDocumentsLabel')}
              title={t('refreshDocumentsLabel')}
              data-testid="refresh-documents-button"
              onClick={onClickRefreshDocuments}
            >
              <Icon glyph="Refresh" />
            </IconButton>
          )}

          <div className={prevNextStyles}>
            <IconButton
              data-testid="docs-toolbar-prev-page-btn"
              aria-label={t('previousPageLabel')}
              title={t('previousPageLabel')}
              onClick={() => getPage(page - 1)}
              disabled={prevButtonDisabled}
            >
              <Icon glyph="ChevronLeft" />
            </IconButton>
            <IconButton
              data-testid="docs-toolbar-next-page-btn"
              aria-label={t('nextPageLabel')}
              title={t('nextPageLabel')}
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
              title: t('outputOptionsLabel'),
              ['aria-label']: t('outputOptionsLabel'),
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
              ? t('operationTimedOutHint')
              : error.message
          }
        />
      )}
      {outdated && !error && (
        <WarningSummary
          data-testid="crud-outdated-message-id"
          warnings={[t('outdatedWarning')]}
        />
      )}
    </div>
  );
};

export { CrudToolbar };
