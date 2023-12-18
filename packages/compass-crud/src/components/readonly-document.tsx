import React from 'react';
import PropTypes from 'prop-types';
import { DocumentList, css, spacing } from '@mongodb-js/compass-components';
import type Document from 'hadron-document';
import type { TypeCastMap } from 'hadron-type-checker';
import { withPreferences } from 'compass-preferences-model';
import { getInsightsForDocument } from '../utils';
type BSONObject = TypeCastMap['Object'];

export const documentStyles = css({
  position: 'relative',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  borderRadius: 'inherit',

  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

export const documentContentStyles = css({
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
});

export type ReadonlyDocumentProps = {
  copyToClipboard?: (doc: Document) => void;
  openInsertDocumentDialog?: (doc: BSONObject, cloned: boolean) => void;
  doc: Document;
  showInsights?: boolean;
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
    return <DocumentList.Document value={this.props.doc} />;
  }

  renderActions() {
    return (
      <DocumentList.DocumentActionsGroup
        onCopy={this.props.copyToClipboard ? this.handleCopy : undefined}
        onClone={
          this.props.openInsertDocumentDialog ? this.handleClone : undefined
        }
        insights={
          this.props.showInsights
            ? getInsightsForDocument(this.props.doc)
            : undefined
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
      <div className={documentStyles} data-testid="readonly-document">
        <div className={documentContentStyles}>
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
    showInsights: PropTypes.bool,
  };
}

export default withPreferences(ReadonlyDocument, ['showInsights'], React);
