import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  Body,
  KeylineCard,
  css,
  cx,
  spacing,
} from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

import { LoadingOverlay } from '../loading-overlay';

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

const noPreviewTextStyles = css({
  padding: spacing[3],
  textAlign: 'center',
  fontStyle: 'italic',
  width: '100%',
});

/**
 * The document preview component.
 */
class DocumentPreview extends Component {
  static displayName = 'DocumentPreview';

  static propTypes = {
    document: PropTypes.object,
    isLoading: PropTypes.bool,
  };

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
        {this.props.isLoading ? (
          <LoadingOverlay />
        ) : this.props.document ? (
          <Document doc={this.props.document} editable={false} />
        ) : (
          <Body className={noPreviewTextStyles}>No Preview Documents</Body>
        )}
      </KeylineCard>
    );
  }
}

export default DocumentPreview;
