import React, { useMemo } from 'react';
import { css, spacing, Body, Code } from '@mongodb-js/compass-components';
import type { ValidatedFakerSchemaMapping } from './types';
import { generateDocument } from './script-generation-utils';

const descriptionStyles = css({
  marginBottom: spacing[200],
});

interface PreviewScreenProps {
  confirmedFakerSchema: ValidatedFakerSchemaMapping[];
}

const NUM_SAMPLE_DOCUMENTS = 5;

function PreviewScreen({ confirmedFakerSchema }: PreviewScreenProps) {
  const sampleDocuments = useMemo(() => {
    const documents = [];
    for (let i = 0; i < NUM_SAMPLE_DOCUMENTS; i++) {
      documents.push(generateDocument(confirmedFakerSchema));
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
      <Code language="javascript" copyable={false}>
        {JSON.stringify(sampleDocuments, null, 2)}
      </Code>
    </div>
  );
}

export default PreviewScreen;
