import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { ObjectId } from 'bson';
import {
  Button,
  CancelLoader,
  css,
  DocumentIcon,
  EmptyContent,
  WorkspaceContainer,
  spacing,
  withDarkMode,
  useCurrentValueRef,
} from '@mongodb-js/compass-components';
import InsertDocumentDialog from './insert-document-dialog';
import BulkUpdateModal from './bulk-update-modal';
import type { DocumentListViewProps } from './document-list-view';
import VirtualizedDocumentListView from './virtualized-document-list-view';
import type { DocumentJsonViewProps } from './document-json-view';
import VirtualizedDocumentJsonView from './virtualized-document-json-view';
import type { DocumentTableViewProps } from './table-view/document-table-view';
import DocumentTableView from './table-view/document-table-view';
import type { CrudToolbarProps } from './crud-toolbar';
import { CrudToolbar } from './crud-toolbar';
import type { Document } from 'hadron-document';
import type { DOCUMENTS_STATUSES } from '../constants/documents-statuses';
import {
  DOCUMENTS_STATUS_ERROR,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_FETCHED_INITIAL,
} from '../constants/documents-statuses';
import { connect } from 'react-redux';
import type { BSONObject, CrudState, DocumentView } from '../stores/crud-store';
import {
  refreshDocuments,
  cancelOperation,
  copyToClipboard,
  removeDocument,
  updateDocument,
  replaceDocument,
  openImportFileDialog,
  openExportFileDialog,
  openCreateIndexModal,
  openCreateSearchIndexModal,
  openQueryExportToLanguageDialog,
  getPage,
  updateMaxDocumentsPerPage,
} from '../stores/documents';
import { drillDown, pathChanged, viewChanged } from '../stores/view';
import { openInsertDocumentDialog } from '../stores/insert';
import { openBulkUpdateModal } from '../stores/bulk-update';
import { openBulkDeleteDialog } from '../stores/bulk-delete';
import { getToolbarSignal } from '../utils/toolbar-signal';
import BulkDeleteModal from './bulk-delete-modal';
import { useTabState } from '@mongodb-js/compass-workspaces/provider';
import {
  useIsLastAppliedQueryOutdated,
  useLastAppliedQuery,
} from '@mongodb-js/compass-query-bar';
import { usePreferences } from 'compass-preferences-model/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';

// Table has its own scrollable container.
const tableStyles = css({
  paddingTop: 0,
  paddingRight: spacing[400],
  paddingBottom: spacing[800], // avoid double scroll
  paddingLeft: spacing[400],
});

const documentsContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  width: '100%',
  height: '100%',
  flexGrow: 1,
  position: 'relative',
});

const loaderContainerStyles = css({
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
});

export type DocumentListProps = {
  isDataLake: boolean;
  isReadonly: boolean;
  openBulkUpdateModal: (updateText?: string) => void;
  cancelOperation: () => void;
  openBulkDeleteDialog: () => void;
  refreshDocuments: (onApply?: boolean) => void;
  openCreateIndexModal: () => void;
  openCreateSearchIndexModal: () => void;
  openQueryExportToLanguageDialog: () => void;
  docs: Document[];
  view: DocumentView;
  status: DOCUMENTS_STATUSES;
  debouncingLoad?: boolean;
  viewChanged: CrudToolbarProps['viewSwitchHandler'];
  darkMode?: boolean;
  isCollectionScan?: boolean;
  isSearchIndexesSupported: boolean;
  openInsertDocumentDialog?: (doc: BSONObject, cloned: boolean) => void;
  openImportFileDialog?: (origin: 'empty-state' | 'crud-toolbar') => void;
} & Omit<DocumentListViewProps, 'className'> &
  Omit<DocumentTableViewProps, 'className'> &
  Omit<DocumentJsonViewProps, 'className'> &
  Pick<
    CrudToolbarProps,
    | 'error'
    | 'count'
    | 'lastCountRunMaxTimeMS'
    | 'loadingCount'
    | 'start'
    | 'end'
    | 'page'
    | 'getPage'
    | 'insertDataHandler'
    | 'openExportFileDialog'
    | 'isWritable'
    | 'isMockDataGeneratorEligibleAndSchemaReady'
    | 'instanceDescription'
    | 'resultId'
    | 'docsPerPage'
    | 'updateMaxDocumentsPerPage'
  >;

const DocumentViewComponent: React.FunctionComponent<
  DocumentListProps & {
    isEditable: boolean;
    outdated: boolean;
    query: unknown;
    initialScrollTop?: number;
    scrollTriggerRef?: React.Ref<HTMLDivElement>;
    scrollableContainerRef?: React.Ref<HTMLDivElement>;
    columnWidths: Record<string, number>;
    onColumnWidthChange: (newColumnWidths: Record<string, number>) => void;
  }
> = ({
  initialScrollTop,
  scrollTriggerRef,
  scrollableContainerRef,
  columnWidths,
  onColumnWidthChange,
  ...props
}) => {
  if (props.docs?.length === 0) {
    return null;
  }

  if (props.view === 'List') {
    return (
      <VirtualizedDocumentListView
        {...props}
        initialScrollTop={initialScrollTop}
        scrollTriggerRef={scrollTriggerRef}
        scrollableContainerRef={scrollableContainerRef}
      />
    );
  } else if (props.view === 'Table') {
    return (
      <>
        {/*
          Table view handles scroll shadow at the AGGrid level so we're 
          just planting an element that will always be in view to avoid
          having shadow on the container element.
        */}
        <div ref={scrollTriggerRef} />
        <DocumentTableView
          // ag-grid would not refresh the theme for the elements that it renders
          // directly otherwise (ie. CellEditor, CellRenderer ...)
          key={props.darkMode ? 'dark' : 'light'}
          {...props}
          className={tableStyles}
          columnWidths={columnWidths}
          onColumnWidthChange={onColumnWidthChange}
        />
      </>
    );
  }

  return (
    <VirtualizedDocumentJsonView
      {...props}
      initialScrollTop={initialScrollTop}
      scrollTriggerRef={scrollTriggerRef}
      scrollableContainerRef={scrollableContainerRef}
    />
  );
};

/**
 * Encapsulates the logic for preserving / restoring scroll top for the current
 * view.
 */
const useViewScrollTop = (view: DocumentView, isFetching: boolean) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [listViewScrollTop, setListViewScrollTop] = useTabState(
    'list-view-initial-scroll-top',
    0
  );
  const [jsonViewScrollTop, setJsonViewScrollTop] = useTabState(
    'json-view-initial-scroll-top',
    0
  );

  const currentViewInitialScrollTop = useMemo(() => {
    if (view === 'List') {
      return listViewScrollTop;
    }
    if (view === 'JSON') {
      return jsonViewScrollTop;
    }
  }, [view, listViewScrollTop, jsonViewScrollTop]);

  const currentViewInitialScrollTopRef = useCurrentValueRef(
    currentViewInitialScrollTop
  );

  const setCurrentViewInitialScrollTop = useCallback(
    (scrollTop: number) => {
      if (view === 'List') {
        setListViewScrollTop(scrollTop);
      } else if (view === 'JSON') {
        setJsonViewScrollTop(scrollTop);
      }
    },
    [view, setListViewScrollTop, setJsonViewScrollTop]
  );

  const setCurrentViewInitialScrollTopRef = useCurrentValueRef(
    setCurrentViewInitialScrollTop
  );

  // Preserve the scroll top for the current view when the entire component is
  // being unmounted
  useLayoutEffect(() => {
    if (
      scrollRef.current &&
      currentViewInitialScrollTopRef.current !== undefined
    ) {
      scrollRef.current.scrollTop = currentViewInitialScrollTopRef.current;
    }

    return () => {
      setCurrentViewInitialScrollTopRef.current(
        scrollRef.current?.scrollTop ?? 0
      );
    };
  }, [currentViewInitialScrollTopRef, setCurrentViewInitialScrollTopRef]);

  // Preserve the scroll top when documents are refreshed and loading List /
  // JSON view unmounts in between
  useLayoutEffect(() => {
    if (
      scrollRef.current &&
      currentViewInitialScrollTopRef.current !== undefined &&
      !isFetching
    ) {
      scrollRef.current.scrollTop = currentViewInitialScrollTopRef.current;
    }
  }, [currentViewInitialScrollTopRef, isFetching]);

  return {
    scrollRef,
    currentViewInitialScrollTop,
    setCurrentViewInitialScrollTop,
  };
};

const DocumentList: React.FunctionComponent<DocumentListProps> = (props) => {
  const {
    view,
    error,
    count,
    lastCountRunMaxTimeMS,
    loadingCount,
    start,
    end,
    page,
    getPage,
    isDataLake,
    isReadonly,
    openExportFileDialog,
    viewChanged,
    isWritable,
    isMockDataGeneratorEligibleAndSchemaReady,
    instanceDescription,
    refreshDocuments,
    cancelOperation,
    openBulkDeleteDialog,
    openQueryExportToLanguageDialog,
    openCreateIndexModal,
    openCreateSearchIndexModal,
    resultId,
    isCollectionScan,
    isSearchIndexesSupported,
    openInsertDocumentDialog,
    openImportFileDialog,
    openBulkUpdateModal,
    docs,
    status,
    debouncingLoad,
    docsPerPage,
    updateMaxDocumentsPerPage,
  } = props;

  const onOpenInsert = useCallback(
    (key: 'insert-document' | 'import-file') => {
      if (key === 'insert-document') {
        openInsertDocumentDialog?.({ _id: new ObjectId() }, false);
      } else if (key === 'import-file') {
        openImportFileDialog?.('crud-toolbar');
      }
    },
    [openImportFileDialog, openInsertDocumentDialog]
  );

  const onApplyClicked = useCallback(() => {
    refreshDocuments(true);
  }, [refreshDocuments]);

  const onResetClicked = useCallback(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const onCancelClicked = useCallback(() => {
    cancelOperation();
  }, [cancelOperation]);

  const onUpdateButtonClicked = useCallback(() => {
    openBulkUpdateModal();
  }, [openBulkUpdateModal]);

  const onDeleteButtonClicked = useCallback(() => {
    openBulkDeleteDialog();
  }, [openBulkDeleteDialog]);

  const query = useLastAppliedQuery('crud');
  const outdated = useIsLastAppliedQueryOutdated('crud');

  const {
    readOnly: preferencesReadOnly,
    readWrite: preferencesReadWrite,
    enableImportExport: isImportExportEnabled,
    legacyUUIDDisplayEncoding,
  } = usePreferences([
    'readOnly',
    'readWrite',
    'enableImportExport',
    'legacyUUIDDisplayEncoding',
  ]);

  const isEditable =
    !preferencesReadOnly &&
    !isDataLake &&
    !isReadonly &&
    Object.keys(query.project ?? {}).length === 0;

  const isEmpty = docs.length === 0;

  const isInitialFetch = status === DOCUMENTS_STATUS_FETCHED_INITIAL;

  const isFetching = status === DOCUMENTS_STATUS_FETCHING && !debouncingLoad;

  const isError = status === DOCUMENTS_STATUS_ERROR;

  const {
    scrollRef,
    currentViewInitialScrollTop,
    setCurrentViewInitialScrollTop,
  } = useViewScrollTop(view, isFetching);

  const handleMaxDocsPerPageChanged = useCallback(
    (newDocsPerPage: number) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      updateMaxDocumentsPerPage(newDocsPerPage);
      // When new documents are added to the list we would like to preserve the
      // scroll position
      if (newDocsPerPage > docsPerPage) {
        setCurrentViewInitialScrollTop(scrollTop);
      } else {
        // When we decrease the number of documents per page, we would like to
        // scroll all the way to the top
        setCurrentViewInitialScrollTop(0);
      }
    },
    [
      scrollRef,
      docsPerPage,
      setCurrentViewInitialScrollTop,
      updateMaxDocumentsPerPage,
    ]
  );

  const [columnWidths, setColumnWidths] = useTabState<Record<string, number>>(
    'columnWidths',
    {}
  );

  const onColumnWidthChange = useCallback(
    (newColumnWidths: Record<string, number>) => {
      setColumnWidths((columnWidths) => {
        return {
          ...columnWidths,
          ...newColumnWidths,
        };
      });
    },
    [setColumnWidths]
  );

  const renderContent = useCallback(
    (scrollTriggerRef: React.Ref<HTMLDivElement>) => {
      let content = null;
      if (isFetching) {
        content = (
          <div className={loaderContainerStyles}>
            <CancelLoader
              data-testid="fetching-documents"
              progressText="Fetching Documents"
              cancelText="Stop"
              onCancel={onCancelClicked}
            />
          </div>
        );
      } else if (!isError) {
        if (isEmpty) {
          if (isInitialFetch) {
            content = (
              <div data-testid="document-list-zero-state">
                <EmptyContent
                  icon={DocumentIcon}
                  title="This collection has no data"
                  subTitle="It only takes a few seconds to import data from a JSON or CSV file."
                  callToAction={
                    isImportExportEnabled && (
                      <Button
                        disabled={!isEditable}
                        onClick={() => {
                          openImportFileDialog?.('empty-state');
                        }}
                        data-testid="import-data-button"
                        variant="primary"
                        size="small"
                      >
                        Import data
                      </Button>
                    )
                  }
                />
              </div>
            );
          } else {
            content = (
              <div data-testid="document-list-zero-state">
                <EmptyContent
                  icon={DocumentIcon}
                  title="No results"
                  subTitle="Try modifying your query to get results."
                />
              </div>
            );
          }
        } else {
          content = (
            <DocumentViewComponent
              {...props}
              isEditable={isEditable}
              outdated={outdated}
              query={query}
              initialScrollTop={currentViewInitialScrollTop}
              scrollableContainerRef={scrollRef}
              scrollTriggerRef={scrollTriggerRef}
              columnWidths={columnWidths}
              onColumnWidthChange={onColumnWidthChange}
              legacyUUIDDisplayEncoding={legacyUUIDDisplayEncoding}
            />
          );
        }
      }
      return content;
    },
    [
      isFetching,
      isError,
      onCancelClicked,
      isEmpty,
      isInitialFetch,
      isImportExportEnabled,
      isEditable,
      openImportFileDialog,
      props,
      outdated,
      query,
      scrollRef,
      currentViewInitialScrollTop,
      columnWidths,
      onColumnWidthChange,
      legacyUUIDDisplayEncoding,
    ]
  );

  const handleViewChanged = useCallback(
    (newView: DocumentView) => {
      if (view === 'List' || view === 'JSON') {
        setCurrentViewInitialScrollTop(scrollRef.current?.scrollTop ?? 0);
      }
      viewChanged(newView);
    },
    [view, setCurrentViewInitialScrollTop, scrollRef, viewChanged]
  );

  const onExpandAllClicked = useCallback(() => {
    docs.forEach((doc) => !doc.expanded && doc.expand());
  }, [docs]);

  const onCollapseAllClicked = useCallback(() => {
    docs.forEach((doc) => doc.expanded && doc.collapse());
  }, [docs]);

  const { tellMoreAboutInsight } = useAssistantActions();

  return (
    <div className={documentsContainerStyles} data-testid="compass-crud">
      <WorkspaceContainer
        scrollableContainerRef={scrollRef}
        initialTopInView={currentViewInitialScrollTop === 0}
        toolbar={
          <CrudToolbar
            activeDocumentView={view}
            error={error}
            count={count}
            isFetching={isFetching}
            isMockDataGeneratorEligibleAndSchemaReady={
              isMockDataGeneratorEligibleAndSchemaReady
            }
            lastCountRunMaxTimeMS={lastCountRunMaxTimeMS}
            loadingCount={loadingCount}
            start={start}
            end={end}
            page={page}
            getPage={getPage}
            insertDataHandler={onOpenInsert}
            onApplyClicked={onApplyClicked}
            onResetClicked={onResetClicked}
            onUpdateButtonClicked={onUpdateButtonClicked}
            onDeleteButtonClicked={onDeleteButtonClicked}
            onExpandAllClicked={onExpandAllClicked}
            onCollapseAllClicked={onCollapseAllClicked}
            openExportFileDialog={openExportFileDialog}
            onOpenExportToLanguage={openQueryExportToLanguageDialog}
            outdated={outdated}
            readonly={!isEditable}
            viewSwitchHandler={handleViewChanged}
            isWritable={isWritable}
            instanceDescription={instanceDescription}
            refreshDocuments={refreshDocuments}
            resultId={resultId}
            querySkip={query.skip}
            queryLimit={query.limit}
            insights={getToolbarSignal({
              query: JSON.stringify(query.filter ?? {}),
              isCollectionScan: Boolean(isCollectionScan),
              isSearchIndexesSupported,
              canCreateIndexes: !preferencesReadWrite,
              onCreateIndex: openCreateIndexModal,
              onCreateSearchIndex: openCreateSearchIndexModal,
              onAssistantButtonClick: tellMoreAboutInsight
                ? () =>
                    tellMoreAboutInsight({
                      id: 'query-executed-without-index',
                      query: JSON.stringify(query),
                    })
                : undefined,
            })}
            docsPerPage={docsPerPage}
            updateMaxDocumentsPerPage={handleMaxDocsPerPageChanged}
          />
        }
      >
        {renderContent}
      </WorkspaceContainer>

      {isEditable && (
        <>
          <InsertDocumentDialog />
          <BulkUpdateModal />
          <BulkDeleteModal />
        </>
      )}
    </div>
  );
};

export default connect(
  (state: CrudState) => ({
    isDataLake: state.collectionMeta.isDataLake,
    isReadonly: state.collectionMeta.isReadonly,
    isWritable: state.collectionMeta.isWritable,
    instanceDescription: state.collectionMeta.instanceDescription,
    isSearchIndexesSupported: state.collectionMeta.isSearchIndexesSupported,
    view: state.view.view,
    table: state.view.table,
    docs: state.documents.docs ?? [],
    start: state.documents.start,
    end: state.documents.end,
    page: state.documents.page,
    count: state.documents.count,
    status: state.documents.status,
    error: state.documents.error,
    resultId: state.documents.resultId,
    isCollectionScan: state.documents.isCollectionScan,
    loadingCount: state.documents.loadingCount,
    lastCountRunMaxTimeMS: state.documents.lastCountRunMaxTimeMS,
    debouncingLoad: state.documents.debouncingLoad,
    docsPerPage: state.documents.docsPerPage,
  }),
  {
    refreshDocuments,
    cancelOperation,
    copyToClipboard,
    drillDown,
    removeDocument,
    updateDocument,
    replaceDocument,
    pathChanged,
    viewChanged,
    openImportFileDialog: (_origin: 'empty-state' | 'crud-toolbar') =>
      openImportFileDialog(),
    openExportFileDialog,
    openCreateIndexModal,
    openCreateSearchIndexModal,
    openQueryExportToLanguageDialog,
    getPage,
    updateMaxDocumentsPerPage,
    openInsertDocumentDialog,
    openBulkUpdateModal,
    openBulkDeleteDialog,
  }
)(withDarkMode(DocumentList));
