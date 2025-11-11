import {
  Body,
  compactBytes,
  css,
  Description,
  palette,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { CollectionState } from '../../modules/collection-tab';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import { MAX_DOCUMENT_COUNT } from './constants';
import { validateDocumentCount } from './utils';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const BYTE_PRECISION_THRESHOLD = 1000;

const titleStyles = css({
  fontWeight: 600,
});

const descriptionStyles = css({
  fontStyle: 'italic',
});

const inputContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[600],
  marginTop: spacing[200],
});

const estimatedDiskSizeStyles = css({
  fontSize: '13px',
  marginTop: spacing[100],
});

const boldStyles = css({
  fontWeight: 600,
});

const formatBytes = (bytes: number) => {
  const decimals = bytes <= BYTE_PRECISION_THRESHOLD ? 0 : 1;
  return compactBytes(bytes, true, decimals);
};

interface OwnProps {
  documentCount: string;
  onDocumentCountChange: (documentCount: string) => void;
}

interface Props extends OwnProps {
  schemaAnalysisState: SchemaAnalysisState;
}

const DocumentCountScreen = ({
  documentCount,
  onDocumentCountChange,
  schemaAnalysisState,
}: Props) => {
  const track = useTelemetry();
  const validationState = validateDocumentCount(documentCount);
  const estimatedDiskSize = useMemo(() => {
    if (
      !validationState.isValid ||
      schemaAnalysisState.status !== 'complete' ||
      !schemaAnalysisState.schemaMetadata.avgDocumentSize ||
      !validationState.parsedValue
    ) {
      return 'Not available';
    }

    return formatBytes(
      schemaAnalysisState.schemaMetadata.avgDocumentSize *
        validationState.parsedValue
    );
  }, [validationState, schemaAnalysisState]);

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
    onDocumentCountChange(event.target.value);

    // Track telemetry for valid numeric values
    const value = Number(event.target.value);
    if (!isNaN(value)) {
      track('Mock Data Document Count Changed', {
        document_count: value,
      });
    }
  };

  return (
    <div>
      <Body className={titleStyles}>
        Specify Number of Documents to Generate
      </Body>
      <Description className={descriptionStyles}>
        Indicate the amount of documents you want to generate below.
      </Description>
      <div className={inputContainerStyles}>
        <TextInput
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
        />
        <div>
          <Body className={boldStyles}>Estimated Disk Size</Body>
          <Body className={estimatedDiskSizeStyles}>{estimatedDiskSize}</Body>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: CollectionState) => ({
  schemaAnalysisState: state.schemaAnalysis,
});

const ConnectedDocumentCountScreen = connect(
  mapStateToProps,
  {}
)(DocumentCountScreen);

export default ConnectedDocumentCountScreen;
