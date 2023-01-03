import React from 'react';
import PropTypes from 'prop-types';
import { css, cx, KeylineCard } from '@mongodb-js/compass-components';

import type { JsonEditorProps } from './json-editor';
import JsonEditor from './json-editor';
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
  JsonEditorProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
  | 'isExpanded'
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

  static displayName = 'DocumentJsonView';
}

export default DocumentJsonView;
