import React from 'react';
import PropTypes from 'prop-types';
import JsonEditor from './json-editor';

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
            key={doc.uuid}
            doc={doc}
            editable={this.props.isEditable}
            isTimeSeries={this.props.isTimeSeries}
            copyToClipboard={this.props.copyToClipboard}
            removeDocument={this.props.removeDocument}
            replaceDocument={this.props.replaceDocument}
            updateDocument={this.props.updateDocument}
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

DocumentJsonView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool,
  isTimeSeries: PropTypes.bool,
  removeDocument: PropTypes.func.isRequired,
  replaceDocument: PropTypes.func.isRequired,
  updateDocument: PropTypes.func.isRequired,
  openInsertDocumentDialog: PropTypes.func.isRequired,
  copyToClipboard: PropTypes.func.isRequired
};

DocumentJsonView.displayName = 'DocumentJsonView';

export default DocumentJsonView;
