import React from 'react';
import PropTypes from 'prop-types';
import JsonEditor from 'components/json-editor';

/**
 * The full document list container class.
 */
const LIST_CLASS = 'document-json';

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
class DocumentJsonView extends React.Component {
  /**
   * Get the document list item components.
   *
   * @param {Array} docs - The raw documents.
   *
   * @return {Array} The document list item components.
   */
  renderDocuments() {
    return this.props.docs.map((doc, i) => {
      return (
        <li className={LIST_ITEM_CLASS} data-test-id={LIST_ITEM_TEST_ID} key={i}>
          <JsonEditor
            doc={doc}
            tz={this.props.tz}
            key={i}
            updateSuccess={this.props.updateSuccess}
            updateError={this.props.updateError}
            editable={this.props.isEditable}
            version={this.props.version}
            copyToClipboard={this.props.copyToClipboard}
            removeDocument={this.props.removeDocument}
            clearUpdateStatus={this.props.clearUpdateStatus}
            replaceExtJsonDocument={this.props.replaceExtJsonDocument}
            openImportFileDialog={this.props.openImportFileDialog}
            openInsertDocumentDialog={this.props.openInsertDocumentDialog} />
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

DocumentJsonView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired,
  copyToClipboard: PropTypes.func,
  removeDocument: PropTypes.func,
  replaceExtJsonDocument: PropTypes.func,
  updateSuccess: PropTypes.bool,
  updateError: PropTypes.string,
  clearUpdateStatus: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
  openInsertDocumentDialog: PropTypes.func,
  openImportFileDialog: PropTypes.func,
  tz: PropTypes.string.isRequired
};

DocumentJsonView.displayName = 'DocumentJsonView';

export default DocumentJsonView;
