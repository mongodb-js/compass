import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
} from '@mongodb-js/compass-components';
import type { InsertDocumentDialogProps } from './insert-document-dialog';
import InsertDocumentDialog from './insert-document-dialog';
import type { BulkUpdateModalProps } from './bulk-update-modal';
import BulkUpdateModal from './bulk-update-modal';
import type { DocumentListViewProps } from './document-list-view';
import VirtualizedDocumentListView from './virtualized-document-list-view';
import type { DocumentJsonViewProps } from './document-json-view';
import VirtualizedDocumentJsonView from './virtualized-document-json-view';
import type { DocumentTableViewProps } from './table-view/document-table-view';
import DocumentTableView from './table-view/document-table-view';
import type { CrudToolbarProps } from './crud-toolbar';
import { CrudToolbar } from './crud-toolbar';
import type { Document } from 'bson';
import type { DOCUMENTS_STATUSES } from '../constants/documents-statuses';
import {
  DOCUMENTS_STATUS_ERROR,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_FETCHED_INITIAL,
} from '../constants/documents-statuses';
import {
  type CrudStore,
  type BSONObject,
  type DocumentView,
} from '../stores/crud-store';
import { getToolbarSignal } from '../utils/toolbar-signal';
import BulkDeleteModal from './bulk-delete-modal';
import { useTabState } from '@mongodb-js/compass-workspaces/provider';
import {
  useIsLastAppliedQueryOutdated,
  useLastAppliedQuery,
} from '@mongodb-js/compass-query-bar';
import { usePreference } from 'compass-preferences-model/provider';

// Table has its own scrollable container.
const tableStyles = css({
  paddingTop: 0,
  paddingRight: spacing[3],
  paddingBottom: spacing[5], // avoid double scroll
  paddingLeft: spacing[3],
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
  store: CrudStore;
  openInsertDocumentDialog?: (doc: BSONObject, cloned: boolean) => void;
  openBulkUpdateModal: () => void;
  updateBulkUpdatePreview: (updateText: string) => void;
  runBulkUpdate: () => void;
  saveUpdateQuery: (name: string) => void;
  openImportFileDialog?: (origin: 'empty-state' | 'crud-toolbar') => void;
  docs: Document[];
  view: DocumentView;
  insert: Partial<InsertDocumentDialogProps> &
    Required<
      Pick<
        InsertDocumentDialogProps,
        | 'doc'
        | 'csfleState'
        | 'isOpen'
        | 'message'
        | 'mode'
        | 'jsonDoc'
        | 'isCommentNeeded'
      >
    >;
  bulkUpdate: Partial<BulkUpdateModalProps> &
    Required<
      Pick<
        BulkUpdateModalProps,
        'isOpen' | 'syntaxError' | 'serverError' | 'preview' | 'updateText'
      >
    >;
  status: DOCUMENTS_STATUSES;
  debouncingLoad?: boolean;
  viewChanged: CrudToolbarProps['viewSwitchHandler'];
  darkMode?: boolean;
  isCollectionScan?: boolean;
  isSearchIndexesSupported: boolean;
  isUpdatePreviewSupported: boolean;
} & Omit<DocumentListViewProps, 'className'> &
  Omit<DocumentTableViewProps, 'className'> &
  Omit<DocumentJsonViewProps, 'className'> &
  Pick<
    InsertDocumentDialogProps,
    | 'closeInsertDocumentDialog'
    | 'insertDocument'
    | 'insertMany'
    | 'updateJsonDoc'
    | 'toggleInsertDocument'
    | 'toggleInsertDocumentView'
    | 'version'
    | 'ns'
    | 'updateComment'
  > &
  Pick<BulkUpdateModalProps, 'closeBulkUpdateModal'> &
  Pick<
    CrudToolbarProps,
    | 'error'
    | 'count'
    | 'loadingCount'
    | 'start'
    | 'end'
    | 'page'
    | 'getPage'
    | 'insertDataHandler'
    | 'openExportFileDialog'
    | 'isWritable'
    | 'instanceDescription'
    | 'refreshDocuments'
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
  }
> = ({
  initialScrollTop,
  scrollTriggerRef,
  scrollableContainerRef,
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

  const currentViewInitialScrollTopRef = useRef(currentViewInitialScrollTop);
  currentViewInitialScrollTopRef.current = currentViewInitialScrollTop;

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

  const setCurrentViewInitialScrollTopRef = useRef(
    setCurrentViewInitialScrollTop
  );
  setCurrentViewInitialScrollTopRef.current = setCurrentViewInitialScrollTop;

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
  }, []);

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
  }, [isFetching]);

  return {
    scrollRef,
    currentViewInitialScrollTop,
    setCurrentViewInitialScrollTop,
  };
};

const useAllDocumentsExpanded = (docs: Document[]) => {
  const [allDocumentsExpanded, setAllDocumentsExpanded] = useState(false);

  const handleExpandAllDocuments = () => {
    for (const doc of docs) {
      if (!doc.expanded) {
        doc.expand();
      }
    }

    setAllDocumentsExpanded(true);
  };

  const handleCollapseAllDocuments = () => {
    for (const doc of docs) {
      if (doc.expanded) {
        doc.collapse();
      }
    }

    setAllDocumentsExpanded(false);
  };

  return {
    allDocumentsExpanded,
    handleExpandAllDocuments,
    handleCollapseAllDocuments,
  };
};

const DocumentList: React.FunctionComponent<DocumentListProps> = (props) => {
  const {
    view,
    error,
    count,
    loadingCount,
    start,
    end,
    page,
    getPage,
    store,
    openExportFileDialog,
    viewChanged,
    isWritable,
    instanceDescription,
    refreshDocuments,
    resultId,
    isCollectionScan,
    isSearchIndexesSupported,
    openInsertDocumentDialog,
    openImportFileDialog,
    openBulkUpdateModal,
    docs,
    status,
    debouncingLoad,
    closeInsertDocumentDialog,
    insertDocument,
    insertMany,
    updateJsonDoc,
    toggleInsertDocument,
    toggleInsertDocumentView,
    version,
    ns,
    updateComment,
    insert,
    bulkUpdate,
    isUpdatePreviewSupported,
    closeBulkUpdateModal,
    updateBulkUpdatePreview,
    runBulkUpdate,
    docsPerPage,
    updateMaxDocumentsPerPage,
  } = props;

  const {
    allDocumentsExpanded,
    handleExpandAllDocuments,
    handleCollapseAllDocuments,
  } = useAllDocumentsExpanded(docs);
  console.log(`🚀 ~ allDocumentsExpanded:`, allDocumentsExpanded);

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
    void store.refreshDocuments(true);
  }, [store]);

  const onResetClicked = useCallback(() => {
    void store.refreshDocuments();
  }, [store]);

  const onCancelClicked = useCallback(() => {
    void store.cancelOperation();
  }, [store]);

  const onUpdateButtonClicked = useCallback(() => {
    openBulkUpdateModal();
  }, [openBulkUpdateModal]);

  const onDeleteButtonClicked = useCallback(() => {
    store.openBulkDeleteDialog();
  }, [store]);

  const onExpandAllDocumentsButtonClicked = useCallback(() => {
    allDocumentsExpanded
      ? handleCollapseAllDocuments()
      : handleExpandAllDocuments();
  }, [
    allDocumentsExpanded,
    handleExpandAllDocuments,
    handleCollapseAllDocuments,
  ]);

  const onSaveUpdateQuery = useCallback(
    (name: string) => {
      void store.saveUpdateQuery(name);
    },
    [store]
  );

  const onCancelBulkDeleteDialog = useCallback(() => {
    store.closeBulkDeleteDialog();
  }, [store]);

  const onConfirmBulkDeleteDialog = useCallback(() => {
    void store.runBulkDelete();
  }, [store]);

  const onExportToLanguageDeleteQuery = useCallback(() => {
    store.openDeleteQueryExportToLanguageDialog();
  }, [store]);

  const query = useLastAppliedQuery('crud');
  const outdated = useIsLastAppliedQueryOutdated('crud');
  const preferencesReadOnly = usePreference('readOnly');
  const isImportExportEnabled = usePreference('enableImportExport');

  const isEditable =
    !preferencesReadOnly &&
    !store.state.isDataLake &&
    !store.state.isReadonly &&
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
                        Import Data
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
    ]
  );

  const handleViewChanged = useCallback(
    (newView: DocumentView) => {
      if (view === 'List' || view === 'JSON') {
        setCurrentViewInitialScrollTop(scrollRef.current?.scrollTop ?? 0);
      }
      viewChanged(newView);
      handleCollapseAllDocuments();
    },
    [
      view,
      setCurrentViewInitialScrollTop,
      scrollRef,
      viewChanged,
      handleCollapseAllDocuments,
    ]
  );

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
            onExpandAllDocumentsButtonClicked={
              onExpandAllDocumentsButtonClicked
            }
            openExportFileDialog={openExportFileDialog}
            outdated={outdated}
            readonly={!isEditable}
            viewSwitchHandler={handleViewChanged}
            isWritable={isWritable}
            instanceDescription={instanceDescription}
            refreshDocuments={refreshDocuments}
            resultId={resultId}
            querySkip={query.skip}
            queryLimit={query.limit}
            insights={getToolbarSignal(
              JSON.stringify(query.filter ?? {}),
              Boolean(isCollectionScan),
              isSearchIndexesSupported,
              store.openCreateIndexModal.bind(store),
              store.openCreateSearchIndexModal.bind(store)
            )}
            docsPerPage={docsPerPage}
            updateMaxDocumentsPerPage={handleMaxDocsPerPageChanged}
            allDocumentsExpanded={allDocumentsExpanded}
          />
        }
      >
        {renderContent}
      </WorkspaceContainer>

      {isEditable && (
        <>
          <InsertDocumentDialog
            closeInsertDocumentDialog={closeInsertDocumentDialog}
            insertDocument={insertDocument}
            insertMany={insertMany}
            updateJsonDoc={updateJsonDoc}
            toggleInsertDocument={toggleInsertDocument}
            toggleInsertDocumentView={toggleInsertDocumentView}
            jsonView
            version={version}
            ns={ns}
            updateComment={updateComment}
            {...insert}
          />
          <BulkUpdateModal
            ns={ns}
            filter={query.filter ?? {}}
            count={count}
            enablePreview={isUpdatePreviewSupported}
            {...bulkUpdate}
            closeBulkUpdateModal={closeBulkUpdateModal}
            updateBulkUpdatePreview={updateBulkUpdatePreview}
            runBulkUpdate={runBulkUpdate}
            saveUpdateQuery={onSaveUpdateQuery}
          />
          <BulkDeleteModal
            open={store.state.bulkDelete.status === 'open'}
            namespace={store.state.ns}
            documentCount={store.state.bulkDelete.affected}
            filter={query.filter ?? {}}
            onCancel={onCancelBulkDeleteDialog}
            onConfirmDeletion={onConfirmBulkDeleteDialog}
            sampleDocuments={store.state.bulkDelete.previews}
            onExportToLanguage={onExportToLanguageDeleteQuery}
          />
        </>
      )}
    </div>
  );
};

export default withDarkMode(DocumentList);
