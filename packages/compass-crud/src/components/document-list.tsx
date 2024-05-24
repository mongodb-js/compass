import React, { useCallback, useLayoutEffect, useRef } from 'react';
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
import DocumentListView from './document-list-view';
import type { DocumentJsonViewProps } from './document-json-view';
import DocumentJsonView from './document-json-view';
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

const listAndJsonStyles = css({
  padding: spacing[3],
  paddingTop: 0,
});

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
  >;

const DocumentViewComponent: React.FunctionComponent<
  DocumentListProps & { isEditable: boolean; outdated: boolean; query: unknown }
> = (props) => {
  if (props.docs?.length === 0) {
    return null;
  }

  if (props.view === 'List') {
    return <DocumentListView {...props} className={listAndJsonStyles} />;
  } else if (props.view === 'Table') {
    return (
      <DocumentTableView
        // ag-grid would not refresh the theme for the elements that it renders
        // directly otherwise (ie. CellEditor, CellRenderer ...)
        key={props.darkMode ? 'dark' : 'light'}
        {...props}
        className={tableStyles}
      />
    );
  }

  return <DocumentJsonView {...props} className={listAndJsonStyles} />;
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
        />
      );
    }
  }

  const [initialScrollTop, setInitialScrollTop] = useTabState(
    'documents-list-initial-scroll-top',
    0
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = initialScrollTop;
    }

    return () => {
      setInitialScrollTop(scrollRef.current?.scrollTop ?? 0);
    };
  }, [initialScrollTop, setInitialScrollTop]);

  return (
    <div className={documentsContainerStyles} data-testid="compass-crud">
      <WorkspaceContainer
        scrollableContainerRef={scrollRef}
        initialTopInView={initialScrollTop === 0}
        toolbar={
          <CrudToolbar
            activeDocumentView={view}
            error={error}
            count={count}
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
            openExportFileDialog={openExportFileDialog}
            outdated={outdated}
            readonly={!isEditable}
            viewSwitchHandler={viewChanged}
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
          />
        }
      >
        {content}
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
