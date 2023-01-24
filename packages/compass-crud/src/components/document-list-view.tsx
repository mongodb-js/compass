import React from 'react';
import PropTypes from 'prop-types';
import { KeylineCard, cx } from '@mongodb-js/compass-components';

import type { DocumentProps } from './document';
import Document from './document';
import type HadronDocument from 'hadron-document';
import type { BSONObject } from '../stores/crud-store';

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

export type DocumentListViewProps = {
  docs: (HadronDocument | BSONObject)[];
  className?: string;
  isEditable: boolean;
} & Pick<
  DocumentProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
  | 'isExpanded'
>;

/**
 * Represents the list view of the documents tab.
 */
class DocumentListView extends React.Component<DocumentListViewProps> {
  /**
   * Get the document list item components.
   *
   * @param {Array} docs - The raw documents.
   *
   * @return {Array} The document list item components.
   */
  renderDocuments() {
    return this.props.docs.map((doc, index) => {
      return (
        <li
          className={LIST_ITEM_CLASS}
          data-testid={LIST_ITEM_TEST_ID}
          key={index}
        >
          <KeylineCard>
            <Document
              doc={doc}
              editable={this.props.isEditable}
              isTimeSeries={this.props.isTimeSeries}
              copyToClipboard={this.props.copyToClipboard}
              removeDocument={this.props.removeDocument}
              replaceDocument={this.props.replaceDocument}
              updateDocument={this.props.updateDocument}
              openInsertDocumentDialog={this.props.openInsertDocumentDialog}
              isExpanded={this.props.isExpanded}
            />
          </KeylineCard>
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
      <ol className={cx(LIST_CLASS, this.props.className)}>
        {this.renderDocuments()}
      </ol>
    );
  }

  static propTypes = {
    docs: PropTypes.array.isRequired,
    isEditable: PropTypes.bool,
    isTimeSeries: PropTypes.bool,
    removeDocument: PropTypes.func,
    replaceDocument: PropTypes.func,
    updateDocument: PropTypes.func,
    openInsertDocumentDialog: PropTypes.func,
    copyToClipboard: PropTypes.func,
    isExpanded: PropTypes.bool,
    className: PropTypes.string,
  };

  static displayName = 'DocumentListView';
}
export default DocumentListView;
