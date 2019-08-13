import PropTypes from 'prop-types';
import React from 'react';
import { ObjectID as ObjectId } from 'bson';
import { StatusRow } from 'hadron-react-components';
import InsertDocumentDialog from 'components/insert-document-dialog';
import DocumentListView from 'components/document-list-view';
import DocumentJsonView from 'components/document-json-view';
import DocumentTableView from 'components/document-table-view';
import Toolbar from 'components/toolbar';

import './index.less';
import './ag-grid-dist.css';

/**
 * Component for the entire document list.
 */
class DocumentList extends React.Component {
  constructor(props) {
    super(props);
    if (props.isExportable) {
      const appRegistry = props.store.localAppRegistry;
      this.queryBarRole = appRegistry.getRole('Query.QueryBar')[0];
      this.queryBar = this.queryBarRole.component;
      this.queryBarStore = appRegistry.getStore(this.queryBarRole.storeName);
      this.queryBarActions = appRegistry.getAction(this.queryBarRole.actionName);
    }
  }

  /**
   * Handle opening of the insert dialog.
   *
   * @param {String} key - Selected option from the Add Data dropdown menu.
   */
  handleOpenInsert(key) {
    if (key === 'insert-document') {
      this.props.openInsertDocumentDialog({ _id: new ObjectId(), '': '' }, false);
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
    if (this.props.view === 'List') {
      return (<DocumentListView {...this.props} />);
    } else if (this.props.view === 'Table') {
      return (<DocumentTableView {...this.props} />);
    }

    return (<DocumentJsonView {...this.props} />);
  }

  /**
   * Render the list of documents.
   *
   * @returns {React.Component} The list.
   */
  renderContent() {
    if (this.props.error) {
      return (
        <StatusRow style="error">
          {this.props.error.message}
        </StatusRow>
      );
    }
    return (
      <div className="column-container">
        <div className="column main">
          {this.renderViews()}
        </div>
      </div>
    );
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
          {...this.props.insert} />
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
          buttonLabel="Find" />
      );
    }
  }

  /**
   * Render the document list.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <div className="content-container content-container-documents compass-documents">
        <div className="controls-container">
          {this.renderQueryBar()}
          <Toolbar
            readonly={!this.props.isEditable}
            insertHandler={this.handleOpenInsert.bind(this)}
            viewSwitchHandler={this.props.viewChanged}
            activeDocumentView={this.props.view}
            {...this.props} />
        </div>
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
  error: PropTypes.object,
  insert: PropTypes.object,
  insertDocument: PropTypes.func,
  insertMany: PropTypes.func,
  isEditable: PropTypes.bool.isRequired,
  isExportable: PropTypes.bool.isRequired,
  store: PropTypes.object.isRequired,
  openInsertDocumentDialog: PropTypes.func,
  openImportFileDialog: PropTypes.func,
  view: PropTypes.string.isRequired,
  updateJsonDoc: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
  viewChanged: PropTypes.func.isRequired,
  tz: PropTypes.string
};

DocumentList.defaultProps = {
  error: null,
  view: 'List',
  version: '3.4.0',
  isEditable: true,
  insert: {},
  tz: 'UTC'
};

export default DocumentList;
