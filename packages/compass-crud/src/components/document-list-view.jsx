import React from 'react';
import PropTypes from 'prop-types';
import Document from './document';

/**
 * The full document list container class.
 */
const LIST_CLASS = 'document-list';

/**
 * The list item class.
 */
const LIST_ITEM_CLASS = `${LIST_CLASS}-item`;

/**
 * The list item test id.
 */
const LIST_ITEM_TEST_ID = LIST_ITEM_CLASS;

/**
 * Represents the list view of the documents tab.
 */
class DocumentListView extends React.Component {
  /**
   * Get the document list item components.
   *
   * @param {Array} docs - The raw documents.
   *
   * @return {Array} The document list item components.
   */
  renderDocuments() {
    return this.props.docs.map((doc) => {
      return (
        <li className={LIST_ITEM_CLASS} data-test-id={LIST_ITEM_TEST_ID} key={doc.getStringId()}>
          <Document
            key={doc.getStringId()}
            doc={doc}
            tz={this.props.tz}
            editable={this.props.isEditable}
            isTimeSeries={this.props.isTimeSeries}
            version={this.props.version}
            copyToClipboard={this.props.copyToClipboard}
            removeDocument={this.props.removeDocument}
            replaceDocument={this.props.replaceDocument}
            updateDocument={this.props.updateDocument}
            openImportFileDialog={this.props.openImportFileDialog}
            openInsertDocumentDialog={this.props.openInsertDocumentDialog}
          />
        </li>
      );
    });
  }

  /**
   * Render the document list view.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <ol className={LIST_CLASS}>
        {this.renderDocuments()}
      </ol>
    );
  }
}

DocumentListView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired,
  isTimeSeries: PropTypes.bool,
  copyToClipboard: PropTypes.func,
  removeDocument: PropTypes.func,
  replaceDocument: PropTypes.func,
  updateDocument: PropTypes.func,
  version: PropTypes.string.isRequired,
  openInsertDocumentDialog: PropTypes.func,
  openImportFileDialog: PropTypes.func,
  tz: PropTypes.string.isRequired
};

DocumentListView.displayName = 'DocumentListView';

export default DocumentListView;
