import React from 'react';
import PropTypes from 'prop-types';
import Document from 'components/document';

import classnames from 'classnames';
import styles from './document-list-view.less';

/**
 * The list item test id.
 */
const LIST_ITEM_TEST_ID = 'document-list-item';

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
    const className = classnames(styles['document-list-item']);
    return this.props.docs.map((doc, i) => {
      return (
        <li className={className} data-test-id={LIST_ITEM_TEST_ID} key={i}>
          <Document
            doc={doc}
            key={i}
            editable={this.props.isEditable}
            removeDocument={this.props.removeDocument}
            updateDocument={this.props.updateDocument}
            copyToClipboard={this.props.copyToClipboard}
            openInsertDocumentDialog={this.props.openInsertDocumentDialog}
            closeAllMenus={this.props.closeAllMenus} />
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
    const className = classnames(styles['document-list']);
    return (
      <ol className={className}>
        {this.renderDocuments()}
      </ol>
    );
  }
}

DocumentListView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired,
  removeDocument: PropTypes.func,
  updateDocument: PropTypes.func,
  openInsertDocumentDialog: PropTypes.func,
  copyToClipboard: PropTypes.func,
  closeAllMenus: PropTypes.func
};

DocumentListView.displayName = 'DocumentListView';

export default DocumentListView;
