import React from 'react';
import { connect } from 'react-redux';
import {
  Body,
  KeylineCard,
  css,
  cx,
  spacing,
  Button,
} from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

import { LoadingOverlay } from './loading-overlay';
import type { DOCUMENT_LOADING_STATES } from '../modules/sample-documents';
import {
  fetchValidDocument,
  fetchInvalidDocument,
} from '../modules/sample-documents';
import type { RootState } from '../modules';

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

function DocumentPreview({
  document,
  loadingState,
  onLoadSampleClick,
}: {
  document?: Record<string, unknown>;
  loadingState: DOCUMENT_LOADING_STATES;
  onLoadSampleClick?: () => void;
}) {
  return (
    <KeylineCard
      className={cx(previewStyles, document ? undefined : noPreviewStyles)}
      data-testid="document-preview"
    >
      {loadingState === 'initial' ? (
        <Body as="div" className={loadSampleStyles}>
          <Button
            data-testid="load-sample-document"
            size="small"
            onClick={onLoadSampleClick}
          >
            Load document
          </Button>
        </Body>
      ) : loadingState === 'loading' ? (
        <LoadingOverlay />
      ) : document ? (
        <Document doc={document} editable={false} />
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

const ValidDocumentPreview = connect(
  (state: RootState) => ({
    document: state.sampleDocuments.validDocument,
    loadingState: state.sampleDocuments.validDocumentState,
  }),
  {
    onLoadSampleClick: fetchValidDocument,
  }
)(DocumentPreview);

const InvalidDocumentPreview = connect(
  (state: RootState) => ({
    document: state.sampleDocuments.invalidDocument,
    loadingState: state.sampleDocuments.invalidDocumentState,
  }),
  {
    onLoadSampleClick: fetchInvalidDocument,
  }
)(DocumentPreview);

export { DocumentPreview, ValidDocumentPreview, InvalidDocumentPreview };
