import React, { Component } from 'react';

import {
  Body,
  KeylineCard,
  css,
  cx,
  spacing,
  Button,
} from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

import { LoadingOverlay } from '../loading-overlay';
import type { DOCUMENT_LOADING_STATES } from '../../modules/sample-documents';

const previewStyles = css({
  display: 'flex',
  height: spacing[6] * 3,
  padding: 0,
  overflow: 'auto',
  position: 'relative',
});

const noPreviewStyles = css({
  alignItems: 'center',
});

const loadSampleStyles = css({
  width: '100%',
  textAlign: 'center',
});

const noPreviewTextStyles = css({
  padding: spacing[3],
  textAlign: 'center',
  fontStyle: 'italic',
  width: '100%',
});

export interface DocumentPreviewProps {
  document?: Record<string, unknown>;
  loadingState: DOCUMENT_LOADING_STATES;
  onLoadSampleClick?: () => void;
}

/**
 * The document preview component.
 */
class DocumentPreview extends Component<DocumentPreviewProps> {
  static displayName = 'DocumentPreview';

  /**
   * Renders the document preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <KeylineCard
        className={cx(
          previewStyles,
          this.props.document ? undefined : noPreviewStyles
        )}
        data-testid="document-preview"
      >
        {this.props.loadingState === 'initial' ? (
          <Body as="div" className={loadSampleStyles}>
            <Button
              data-testid="load-sample-document"
              size="small"
              onClick={this.props.onLoadSampleClick}
            >
              Load document
            </Button>
          </Body>
        ) : this.props.loadingState === 'loading' ? (
          <LoadingOverlay />
        ) : this.props.document ? (
          <Document doc={this.props.document} editable={false} />
        ) : (
          <Body
            data-testid="load-sample-no-preview"
            className={noPreviewTextStyles}
          >
            No Preview Documents
          </Body>
        )}
      </KeylineCard>
    );
  }
}

export default DocumentPreview;
