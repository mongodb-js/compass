import PropTypes from 'prop-types';
import React from 'react';
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
import type { DocumentListViewProps } from './document-list-view';
import DocumentListView from './document-list-view';
import type { DocumentJsonViewProps } from './document-json-view';
import DocumentJsonView from './document-json-view';
import type { DocumentTableViewProps } from './table-view/document-table-view';
import DocumentTableView from './table-view/document-table-view';
import type { CrudToolbarProps } from './crud-toolbar';
import { CrudToolbar } from './crud-toolbar';

import type { DOCUMENTS_STATUSES } from '../constants/documents-statuses';
import {
  DOCUMENTS_STATUS_ERROR,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_FETCHED_CUSTOM,
  DOCUMENTS_STATUSES_ALL,
} from '../constants/documents-statuses';

import './index.less';
import type { CrudStore, BSONObject } from '../stores/crud-store';
import type Document from 'hadron-document';

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

export type DocumentListProps = {
  store: CrudStore;
  openInsertDocumentDialog?: (doc: BSONObject, cloned: boolean) => void;
  openImportFileDialog?: (origin: 'empty-state' | 'crud-toolbar') => void;
  docs: Document[];
  view: 'List' | 'JSON' | 'Table';
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
  status: DOCUMENTS_STATUSES;
  debouncingLoad?: boolean;
  viewChanged: CrudToolbarProps['viewSwitchHandler'];
  darkMode?: boolean;
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
    | 'tz'
    | 'ns'
    | 'updateComment'
  > &
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
    | 'localAppRegistry'
    | 'isExportable'
    | 'openExportFileDialog'
    | 'outdated'
    | 'isWritable'
    | 'instanceDescription'
    | 'refreshDocuments'
    | 'resultId'
  >;

/**
 * Component for the entire document list.
 */
class DocumentList extends React.Component<DocumentListProps> {
  onApplyClicked() {
    void this.props.store.refreshDocuments(true);
  }

  onResetClicked() {
    void this.props.store.refreshDocuments();
  }

  onCancelClicked() {
    this.props.store.cancelOperation();
  }

  /**
   * Handle opening of the insert dialog.
   *
   * @param {String} key - Selected option from the Add Data dropdown menu.
   */
  handleOpenInsert(key: 'insert-document' | 'import-file') {
    if (key === 'insert-document') {
      this.props.openInsertDocumentDialog?.(
        { _id: new ObjectId(), '': '' },
        false
      );
    } else if (key === 'import-file') {
      this.props.openImportFileDialog?.('crud-toolbar');
    }
  }

  /**
   * Render the views for the document list.
   *
   * @returns {React.Component} The document list views.
   */
  renderViews() {
    if (this.props.docs?.length === 0) {
      return null;
    }

    if (this.props.view === 'List') {
      return <DocumentListView {...this.props} className={listAndJsonStyles} />;
    } else if (this.props.view === 'Table') {
      return (
        <DocumentTableView
          // ag-grid would not refresh the theme for the elements that it renders directly otherwise (ie. CellEditor, CellRenderer ...)
          key={this.props.darkMode ? 'dark' : 'light'}
          {...this.props}
          className={tableStyles}
        />
      );
    }

    return <DocumentJsonView {...this.props} className={listAndJsonStyles} />;
  }

  /*
   * Render the fetching indicator with cancel button
   */
  renderFetching() {
    return (
      <div className="loader">
        <CancelLoader
          data-testid="fetching-documents"
          progressText="Fetching Documents"
          cancelText="Stop"
          onCancel={this.onCancelClicked.bind(this)}
        />
      </div>
    );
  }

  /**
   * Render the list of documents.
   *
   * @returns {React.Component} The list.
   */
  renderContent() {
    if (this.props.error) {
      return null;
    }

    if (
      this.props.status === DOCUMENTS_STATUS_FETCHING &&
      !this.props.debouncingLoad
    ) {
      return this.renderFetching();
    }

    return this.renderViews();
  }

  /**
   * Render the insert modal.
   *
   * @returns {React.Component} The insert modal.
   */
  renderInsertModal() {
    if (this.props.isEditable) {
      return (
        <InsertDocumentDialog
          closeInsertDocumentDialog={this.props.closeInsertDocumentDialog}
          insertDocument={this.props.insertDocument}
          insertMany={this.props.insertMany}
          updateJsonDoc={this.props.updateJsonDoc}
          toggleInsertDocument={this.props.toggleInsertDocument}
          toggleInsertDocumentView={this.props.toggleInsertDocumentView}
          jsonView
          version={this.props.version}
          tz={this.props.tz}
          ns={this.props.ns}
          updateComment={this.props.updateComment}
          {...this.props.insert}
        />
      );
    }
  }

  /**
   * Render EmptyContent view when no documents are present.
   *
   * @returns {React.Component} The query bar.
   */
  renderZeroState() {
    if (
      this.props.docs.length > 0 ||
      this.props.status === DOCUMENTS_STATUS_FETCHING
    ) {
      return null;
    }

    if (this.props.status === DOCUMENTS_STATUS_ERROR) {
      return null;
    }

    if (
      this.props.docs.length === 0 &&
      this.props.status === DOCUMENTS_STATUS_FETCHED_CUSTOM
    ) {
      return (
        <div className="document-list-zero-state">
          <EmptyContent
            icon={DocumentIcon}
            title="No results"
            subTitle="Try modifying your query to get results."
          />
        </div>
      );
    }

    return (
      <div className="document-list-zero-state">
        <EmptyContent
          icon={DocumentIcon}
          title="This collection has no data"
          subTitle="It only takes a few seconds to import data from a JSON or CSV file."
          callToAction={
            <Button
              disabled={!this.props.isEditable}
              onClick={() =>
                void this.props.openImportFileDialog?.('empty-state')
              }
              data-testid="import-data-button"
              variant="primary"
              size="small"
            >
              Import Data
            </Button>
          }
        />
      </div>
    );
  }

  /**
   * Render the document list.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <div className="compass-documents">
        <WorkspaceContainer
          toolbar={
            <CrudToolbar
              activeDocumentView={this.props.view}
              error={this.props.error}
              count={this.props.count}
              loadingCount={this.props.loadingCount}
              start={this.props.start}
              end={this.props.end}
              page={this.props.page}
              getPage={this.props.getPage}
              insertDataHandler={this.handleOpenInsert.bind(this)}
              localAppRegistry={this.props.store.localAppRegistry}
              isExportable={this.props.isExportable}
              onApplyClicked={this.onApplyClicked.bind(this)}
              onResetClicked={this.onResetClicked.bind(this)}
              openExportFileDialog={this.props.openExportFileDialog}
              outdated={this.props.outdated}
              readonly={!this.props.isEditable}
              viewSwitchHandler={this.props.viewChanged}
              isWritable={this.props.isWritable}
              instanceDescription={this.props.instanceDescription}
              refreshDocuments={this.props.refreshDocuments}
              resultId={this.props.resultId}
            />
          }
        >
          {this.renderZeroState()}
          {this.renderContent()}
          {this.renderInsertModal()}
        </WorkspaceContainer>
      </div>
    );
  }

  static displayName = 'DocumentList';

  static propTypes = {
    closeInsertDocumentDialog: PropTypes.func,
    toggleInsertDocumentView: PropTypes.func.isRequired,
    toggleInsertDocument: PropTypes.func.isRequired,
    count: PropTypes.number,
    start: PropTypes.number,
    end: PropTypes.number,
    page: PropTypes.number,
    getPage: PropTypes.func,
    error: PropTypes.object,
    insert: PropTypes.object.isRequired,
    insertDocument: PropTypes.func,
    insertMany: PropTypes.func,
    isEditable: PropTypes.bool.isRequired,
    isExportable: PropTypes.bool.isRequired,
    isTimeSeries: PropTypes.bool,
    store: PropTypes.object.isRequired,
    openInsertDocumentDialog: PropTypes.func,
    openImportFileDialog: PropTypes.func,
    openExportFileDialog: PropTypes.func,
    refreshDocuments: PropTypes.func,
    removeDocument: PropTypes.func,
    replaceDocument: PropTypes.func,
    updateDocument: PropTypes.func,
    updateJsonDoc: PropTypes.func,
    version: PropTypes.string.isRequired,
    view: PropTypes.oneOf(['List', 'JSON', 'Table'] as const).isRequired,
    viewChanged: PropTypes.func.isRequired,
    docs: PropTypes.array.isRequired,
    ns: PropTypes.string,
    tz: PropTypes.string,
    updateComment: PropTypes.func.isRequired,
    status: PropTypes.oneOf(DOCUMENTS_STATUSES_ALL).isRequired,
    debouncingLoad: PropTypes.bool,
    loadingCount: PropTypes.bool,
    outdated: PropTypes.bool,
    resultId: PropTypes.number,
    isWritable: PropTypes.bool,
    instanceDescription: PropTypes.string,
    darkMode: PropTypes.bool,
  } as any;

  static defaultProps = {
    error: null,
    view: 'List',
    version: '3.4.0',
    isEditable: true,
    insert: {} as any,
    tz: 'UTC',
  } as const;
}

DocumentList.displayName = 'DocumentList';

DocumentList.propTypes = {
  closeInsertDocumentDialog: PropTypes.func,
  toggleInsertDocumentView: PropTypes.func.isRequired,
  toggleInsertDocument: PropTypes.func.isRequired,
  count: PropTypes.number,
  start: PropTypes.number,
  end: PropTypes.number,
  page: PropTypes.number,
  getPage: PropTypes.func,
  error: PropTypes.object,
  insert: PropTypes.object,
  insertDocument: PropTypes.func,
  insertMany: PropTypes.func,
  isEditable: PropTypes.bool.isRequired,
  isExportable: PropTypes.bool.isRequired,
  isTimeSeries: PropTypes.bool,
  store: PropTypes.object.isRequired,
  openInsertDocumentDialog: PropTypes.func,
  openImportFileDialog: PropTypes.func,
  openExportFileDialog: PropTypes.func,
  refreshDocuments: PropTypes.func,
  removeDocument: PropTypes.func,
  replaceDocument: PropTypes.func,
  updateDocument: PropTypes.func,
  updateJsonDoc: PropTypes.func,
  version: PropTypes.string.isRequired,
  view: PropTypes.string.isRequired,
  viewChanged: PropTypes.func.isRequired,
  docs: PropTypes.array,
  ns: PropTypes.string,
  tz: PropTypes.string,
  updateComment: PropTypes.func.isRequired,
  status: PropTypes.string,
  debouncingLoad: PropTypes.bool,
  loadingCount: PropTypes.bool,
  outdated: PropTypes.bool,
  resultId: PropTypes.number,
  isWritable: PropTypes.bool,
  instanceDescription: PropTypes.string,
  darkMode: PropTypes.bool,
};

DocumentList.defaultProps = {
  error: null,
  view: 'List',
  version: '3.4.0',
  isEditable: true,
  insert: {},
  tz: 'UTC',
};

export default withDarkMode(DocumentList);
