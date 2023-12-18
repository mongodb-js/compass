import React from 'react';
import { css, cx, KeylineCard, spacing } from '@mongodb-js/compass-components';

import type { JSONEditorProps } from './json-editor';
import JSONEditor from './json-editor';
import type Document from 'hadron-document';

const listStyles = css({
  listStyle: 'none',
  position: 'relative',
  width: '100%',
});

const listItemStyles = css({
  position: 'relative',
  marginBottom: spacing[2],

  '&:last-child': {
    marginBottom: 0,
    borderBottom: '0px solid transparent',
  },
});

export type DocumentJsonViewProps = {
  docs: Document[];
  isEditable: boolean;
  className?: string;
} & Pick<
  JSONEditorProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
  | 'isExpanded'
  | 'fields'
>;

const keylineCardCSS = css({
  overflow: 'hidden',
});

/**
 * Represents the list view of the documents tab.
 */
class DocumentJsonView extends React.Component<DocumentJsonViewProps> {
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
        <li className={listItemStyles} data-testid="document-json-item" key={i}>
          <KeylineCard className={keylineCardCSS}>
            <JSONEditor
              key={doc.uuid}
              doc={doc}
              editable={this.props.isEditable}
              isTimeSeries={this.props.isTimeSeries}
              copyToClipboard={this.props.copyToClipboard}
              removeDocument={this.props.removeDocument}
              replaceDocument={this.props.replaceDocument}
              updateDocument={this.props.updateDocument}
              openInsertDocumentDialog={this.props.openInsertDocumentDialog}
              isExpanded={this.props.isExpanded}
              fields={this.props.fields}
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
      <ol className={cx(listStyles, this.props.className)}>
        {this.renderDocuments()}
      </ol>
    );
  }
}

export default DocumentJsonView;
