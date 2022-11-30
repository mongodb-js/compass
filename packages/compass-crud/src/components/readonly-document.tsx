import React from 'react';
import PropTypes from 'prop-types';
import { DocumentList } from '@mongodb-js/compass-components';
import type Document from 'hadron-document';
import type { TypeCastMap } from 'hadron-type-checker';
type BSONObject = TypeCastMap['Object'];

/**
 * The base class.
 */
const BASE = 'document';

/**
 * The contents class.
 */
const CONTENTS = `${BASE}-contents`;

/**
 * The test id.
 */
const TEST_ID = 'readonly-document';

export type ReadonlyDocumentProps = {
  copyToClipboard?: (doc: Document) => void;
  openInsertDocumentDialog?: (doc: BSONObject, cloned: boolean) => void;
  doc: Document;
  expandAll: boolean;
};

/**
 * Component for a single readonly document in a list of documents.
 */
class ReadonlyDocument extends React.Component<ReadonlyDocumentProps> {
  handleClone = () => {
    const clonedDoc = this.props.doc.generateObject({
      excludeInternalFields: true,
    });
    this.props.openInsertDocumentDialog?.(clonedDoc, true);
  };

  /**
   * Handle copying JSON to clipboard of the document.
   */
  handleCopy = () => {
    this.props.copyToClipboard?.(this.props.doc);
  };

  /**
   * Get the elements for the document.
   *
   * @returns {Array} The elements.
   */
  renderElements() {
    return (
      <DocumentList.Document
        value={this.props.doc}
        expanded={this.props.expandAll}
      />
    );
  }

  renderActions() {
    return (
      <DocumentList.DocumentActionsGroup
        onCopy={this.props.copyToClipboard ? this.handleCopy : undefined}
        onClone={
          this.props.openInsertDocumentDialog ? this.handleClone : undefined
        }
      />
    );
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={BASE} data-testid={TEST_ID}>
        <div className={CONTENTS}>
          {this.renderElements()}
          {this.renderActions()}
        </div>
      </div>
    );
  }

  static displayName = 'ReadonlyDocument';

  static propTypes = {
    copyToClipboard: PropTypes.func,
    doc: PropTypes.object.isRequired,
    expandAll: PropTypes.bool,
    openInsertDocumentDialog: PropTypes.func,
  };
}

export default ReadonlyDocument;
