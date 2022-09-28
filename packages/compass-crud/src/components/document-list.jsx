import PropTypes from 'prop-types';
import React from 'react';
import { ObjectID as ObjectId } from 'bson';
import { StatusRow, ZeroState } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import {
  CancelLoader,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import InsertDocumentDialog from './insert-document-dialog';
import ZeroGraphic from './zero-graphic';
import DocumentListView from './document-list-view';
import DocumentJsonView from './document-json-view';
import DocumentTableView from './document-table-view';
import { CrudToolbar } from './crud-toolbar';

import {
  DOCUMENTS_STATUS_ERROR,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_FETCHED_CUSTOM,
} from '../constants/documents-statuses';

import './index.less';
import './ag-grid-dist.css';

// From https://github.com/mongodb/mongo/blob/master/src/mongo/base/error_codes.yml#L86
const ERROR_CODE_OPERATION_TIMED_OUT = 50;

const INCREASE_MAX_TIME_MS_HINT =
  'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the expanded filter options.';

function isOperationTimedOutError(err) {
  return (
    err.name === 'MongoServerError' &&
    err.code?.value === ERROR_CODE_OPERATION_TIMED_OUT
  );
}

/**
 * Component for the entire document list.
 */
class DocumentList extends React.Component {
  onApplyClicked() {
    this.props.store.refreshDocuments();
  }

  onResetClicked() {
    this.props.store.refreshDocuments();
  }

  onCancelClicked() {
    this.props.store.cancelOperation();
  }

  /**
   * Handle opening of the insert dialog.
   *
   * @param {String} key - Selected option from the Add Data dropdown menu.
   */
  handleOpenInsert(key) {
    if (key === 'insert-document') {
      this.props.openInsertDocumentDialog(
        { _id: new ObjectId(), '': '' },
        false
      );
    } else if (key === 'import-file') {
      this.props.openImportFileDialog();
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
      return <DocumentListView {...this.props} />;
    } else if (this.props.view === 'Table') {
      return <DocumentTableView {...this.props} />;
    }

    return <DocumentJsonView {...this.props} />;
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
      const errorMessage = isOperationTimedOutError(this.props.error)
        ? INCREASE_MAX_TIME_MS_HINT
        : this.props.error.message;

      return <StatusRow style="error">{errorMessage}</StatusRow>;
    }

    if (
      this.props.status === DOCUMENTS_STATUS_FETCHING &&
      !this.props.debouncingLoad
    ) {
      return this.renderFetching();
    }

    return <WorkspaceContainer>{this.renderViews()}</WorkspaceContainer>;
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
   * Render the query bar.
   *
   * @returns {React.Component} The query bar.
   */
  renderQueryBar() {
    if (this.props.isExportable) {
      return (
        <this.queryBar
          store={this.queryBarStore}
          actions={this.queryBarActions}
          buttonLabel="Find"
          resultId={this.props.resultId}
          onApply={this.onApplyClicked.bind(this)}
          onReset={this.onResetClicked.bind(this)}
        />
      );
    }
  }

  /**
   * Render ZeroState view when no documents are present.
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

    let header = 'This collection has no data';
    let subtext =
      'It only takes a few seconds to import data from a JSON or CSV file';

    if (
      this.props.docs.length === 0 &&
      this.props.status === DOCUMENTS_STATUS_FETCHED_CUSTOM
    ) {
      header = 'No results';
      subtext = 'Try to modify your query to get results';

      return (
        <div className="document-list-zero-state">
          <ZeroGraphic />
          <ZeroState header={header} subtext={subtext} />
        </div>
      );
    }

    const editableClass = !this.props.isEditable ? 'disabled' : '';

    return (
      <div className="document-list-zero-state">
        <ZeroGraphic />
        <ZeroState header={header} subtext={subtext}>
          <div className="document-list-zero-state-action">
            <div>
              <TextButton
                dataTestId="import-data-button"
                className={`btn btn-primary btn-lg ${editableClass}`}
                text="Import Data"
                clickHandler={this.props.openImportFileDialog}
              />
            </div>
          </div>
        </ZeroState>
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
        {this.renderZeroState()}
        {this.renderContent()}
        {this.renderInsertModal()}
      </div>
    );
  }
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
};

DocumentList.defaultProps = {
  error: null,
  view: 'List',
  version: '3.4.0',
  isEditable: true,
  insert: {},
  tz: 'UTC',
};

export default DocumentList;
