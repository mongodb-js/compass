import React from 'react';
import { css, cx, KeylineCard } from '@mongodb-js/compass-components';

import type { JSONEditorProps } from './json-editor';
import JSONEditor from './json-editor';
import type Document from 'hadron-document';

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
        <li className={LIST_ITEM_CLASS} data-testid={LIST_ITEM_TEST_ID} key={i}>
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
      <ol className={cx(LIST_CLASS, this.props.className)}>
        {this.renderDocuments()}
      </ol>
    );
  }
}

export default DocumentJsonView;
