import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import {
  css,
  spacing,
  Body,
  Description,
  Link,
  TextInput,
  Banner,
  BannerVariant,
  compactBytes,
} from '@mongodb-js/compass-components';

import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

import type { CollectionState } from '../../modules/collection-tab';
import { mockDataGeneratorDocumentCountChanged } from '../../modules/collection-tab';
import { SCHEMA_ANALYSIS_STATE_COMPLETE } from '../../schema-analysis-types';
import { MAX_DOCUMENT_COUNT } from './constants';
import type { FakerSchema } from './types';
import type { ArrayLengthMap } from './script-generation-utils';
import { generateDocument } from './script-generation-utils';
import { validateDocumentCount } from './utils';

const FAKER_FUNCTIONS_URL = 'https://fakerjs.dev/api/';
const BYTE_PRECISION_THRESHOLD = 1000;

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[600],
});

// Preview section styles
const previewSectionStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const previewTitleStyles = css({
  fontWeight: 600,
});

const previewEditorStyles = css({
  maxHeight: '300px',
  overflow: 'auto',
});

// Document count section styles
const docCountSectionStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const docCountTitleStyles = css({
  fontWeight: 600,
});

const docCountDescriptionStyles = css({
  fontStyle: 'italic',
});

const inputContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[600],
  marginTop: spacing[200],
});

const estimatedDiskSizeLabelStyles = css({
  fontWeight: 600,
});

const estimatedDiskSizeValueStyles = css({
  fontSize: '13px',
  marginTop: spacing[100],
});

const NUM_PREVIEW_DOCUMENTS = 3;

const formatBytes = (bytes: number) => {
  const decimals = bytes <= BYTE_PRECISION_THRESHOLD ? 0 : 1;
  return compactBytes(bytes, true, decimals);
};

interface PreviewAndDocCountScreenProps {
  documentCount: string;
  fakerSchema: FakerSchema | null;
  avgDocumentSize: number | undefined;
  arrayLengthMap: ArrayLengthMap;
  onDocumentCountChanged: (documentCount: string) => void;
}

const PreviewAndDocCountScreen = ({
  documentCount,
  fakerSchema,
  avgDocumentSize,
  arrayLengthMap,
  onDocumentCountChanged,
}: PreviewAndDocCountScreenProps) => {
  const validationState = validateDocumentCount(documentCount);

  const estimatedDiskSize = useMemo(() => {
    if (
      !validationState.isValid ||
      !avgDocumentSize ||
      !validationState.parsedValue
    ) {
      return 'Not available';
    }
    return formatBytes(avgDocumentSize * validationState.parsedValue);
  }, [validationState, avgDocumentSize]);

  const errorState = useMemo(() => {
    if (validationState.isValid) {
      return { state: 'none' as const };
    }
    return {
      state: 'error' as const,
      message: validationState.errorMessage,
    };
  }, [validationState.isValid, validationState.errorMessage]);

  const handleDocumentCountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onDocumentCountChanged(event.target.value);
  };

  const previewDocuments = useMemo(() => {
    if (!fakerSchema) {
      return [];
    }
    const docs = [];
    for (let i = 0; i < NUM_PREVIEW_DOCUMENTS; i++) {
      docs.push(generateDocument(fakerSchema, arrayLengthMap));
    }
    return docs;
  }, [fakerSchema, arrayLengthMap]);

  const previewJson = useMemo(() => {
    if (previewDocuments.length === 0) {
      return '// No preview available';
    }
    return previewDocuments
      .map((doc, index) => {
        const separator = `// --- Document ${index + 1} ---`;
        return `${separator}\n${JSON.stringify(doc, null, 2)}`;
      })
      .join('\n\n');
  }, [previewDocuments]);

  return (
    <div className={containerStyles} data-testid="preview-and-doc-count-screen">
      {/* Preview Section */}
      <section className={previewSectionStyles}>
        <Body className={previewTitleStyles}>Preview Mock Data</Body>
        <Body>
          Below are examples of documents that will be generated when you run
          your script. If you&apos;d like to make any changes to the script (for
          ex. what{' '}
          <Link href={FAKER_FUNCTIONS_URL} target="_blank">
            faker functions
          </Link>{' '}
          are being used to generate the documents) you can do so in the next
          step.
        </Body>
        {fakerSchema ? (
          <div className={previewEditorStyles}>
            <CodemirrorMultilineEditor
              id="preview-documents"
              text={previewJson}
              language="json"
              readOnly
              data-testid="preview-documents-editor"
            />
          </div>
        ) : (
          <Banner variant={BannerVariant.Warning}>
            No faker schema available. Please go back and confirm your schema.
          </Banner>
        )}
      </section>

      {/* Document Count Section */}
      <section className={docCountSectionStyles}>
        <Body className={docCountTitleStyles}>
          Specify Number of Documents to Generate
        </Body>
        <Description className={docCountDescriptionStyles}>
          Indicate the amount of documents you want to generate below.
        </Description>
        <div className={inputContainerStyles}>
          <TextInput
            id="document-count-input"
            label="Documents to generate in current collection"
            type="number"
            value={documentCount}
            onChange={handleDocumentCountChange}
            min={1}
            max={MAX_DOCUMENT_COUNT}
            state={errorState.state}
            errorMessage={
              errorState.state === 'error' ? errorState.message : undefined
            }
            data-testid="document-count-input"
          />
          <div>
            <Body className={estimatedDiskSizeLabelStyles}>
              Estimated Disk Size
            </Body>
            <Body
              className={estimatedDiskSizeValueStyles}
              data-testid="estimated-disk-size"
            >
              {estimatedDiskSize}
            </Body>
          </div>
        </div>
      </section>
    </div>
  );
};

const mapStateToProps = (state: CollectionState) => {
  const { fakerSchemaGeneration, schemaAnalysis, mockDataGenerator } = state;

  return {
    documentCount: mockDataGenerator.documentCount,
    fakerSchema:
      fakerSchemaGeneration.status === 'completed'
        ? fakerSchemaGeneration.fakerSchema
        : null,
    avgDocumentSize:
      schemaAnalysis?.status === SCHEMA_ANALYSIS_STATE_COMPLETE
        ? schemaAnalysis.schemaMetadata.avgDocumentSize
        : undefined,
    arrayLengthMap:
      schemaAnalysis?.status === SCHEMA_ANALYSIS_STATE_COMPLETE
        ? schemaAnalysis.arrayLengthMap
        : {},
  };
};

const mapDispatchToProps = {
  onDocumentCountChanged: mockDataGeneratorDocumentCountChanged,
};

const ConnectedPreviewAndDocCountScreen = connect(
  mapStateToProps,
  mapDispatchToProps
)(PreviewAndDocCountScreen);

export default ConnectedPreviewAndDocCountScreen;
