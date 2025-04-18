import React from 'react';
import {
  Body,
  KeylineCard,
  css,
  cx,
  spacing,
} from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

const previewStyles = css({
  display: 'flex',
  height: spacing[1600] * 3,
  padding: 0,
  overflow: 'auto',
  position: 'relative',
});

const noPreviewStyles = css({
  alignItems: 'center',
});

const noPreviewTextStyles = css({
  padding: spacing[400],
  textAlign: 'center',
  fontStyle: 'italic',
  width: '100%',
});

function DocumentPreview({ document }: { document?: Record<string, unknown> }) {
  return (
    <KeylineCard
      className={cx(previewStyles, document ? undefined : noPreviewStyles)}
      data-testid="document-preview"
    >
      {document ? (
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

export { DocumentPreview };
