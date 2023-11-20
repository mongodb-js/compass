import React from 'react';
import PropTypes from 'prop-types';
import { KeylineCard, css, cx, spacing } from '@mongodb-js/compass-components';

import type { DocumentProps } from './document';
import Document from './document';
import type HadronDocument from 'hadron-document';
import type { BSONObject } from '../stores/crud-store';

const listStyles = css({
  listStyle: 'none',
  position: 'relative',
  width: '100%',
});

const listItemStyles = css({
  position: 'relative',
  marginBottom: spacing[1],

  '&:last-child': {
    marginBottom: 0,
    borderBottom: '0 solid transparent',
  },
});

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
          className={listItemStyles}
          data-testid="document-list-item"
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
      <ol
        className={cx(listStyles, this.props.className)}
        data-testid="document-list"
      >
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
    className: PropTypes.string,
  };

  static displayName = 'DocumentListView';
}
export default DocumentListView;
