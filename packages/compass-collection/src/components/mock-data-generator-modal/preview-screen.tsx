import React, { useMemo } from 'react';
import {
  css,
  spacing,
  Body,
  DocumentList,
} from '@mongodb-js/compass-components';
import HadronDocument from 'hadron-document';
import type { FakerSchema } from './types';
import { generateDocument } from './script-generation-utils';

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const documentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
});

const documentWrapperStyles = css({
  border: '1px solid #E8EDEB',
  borderRadius: '6px',
  padding: spacing[200],
});

interface PreviewScreenProps {
  confirmedFakerSchema: FakerSchema;
}

const NUM_SAMPLE_DOCUMENTS = 3;

function PreviewScreen({ confirmedFakerSchema }: PreviewScreenProps) {
  const sampleDocuments = useMemo(() => {
    const documents = [];
    for (let i = 0; i < NUM_SAMPLE_DOCUMENTS; i++) {
      const plainDoc = generateDocument(confirmedFakerSchema);
      const hadronDoc = new HadronDocument(plainDoc);
      hadronDoc.expand(); // Expand by default for better preview
      documents.push(hadronDoc);
    }

    return documents;
  }, [confirmedFakerSchema]);

  return (
    <div data-testid="preview-screen">
      <Body as="h2" baseFontSize={16} weight="medium">
        Preview Mock Data
      </Body>
      <Body className={descriptionStyles}>
        Below is a sample of documents that will be generated based on your
        script
      </Body>
      <div className={documentContainerStyles}>
        {sampleDocuments.map((doc, index) => (
          <div key={index} className={documentWrapperStyles}>
            <DocumentList.Document value={doc} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PreviewScreen;
