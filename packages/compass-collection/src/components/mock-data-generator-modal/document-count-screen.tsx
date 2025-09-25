import {
  Body,
  css,
  palette,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { CollectionState } from '../../modules/collection-tab';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import numeral from 'numeral';
import { DEFAULT_DOCUMENT_COUNT, MAX_DOCUMENT_COUNT } from './constants';

const BYTE_PRECISION_THRESHOLD = 1000;

const titleStyles = css({
  fontWeight: 600,
});

const descriptionStyles = css({
  color: palette.gray.dark1,
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
  const precision = bytes <= BYTE_PRECISION_THRESHOLD ? '0' : '0.0';
  return numeral(bytes).format(precision + 'b');
};

type ErrorState =
  | {
      state: 'error';
      message: string;
    }
  | {
      state: 'none';
    };

interface OwnProps {
  documentCount: number;
  onDocumentCountChange: (documentCount: number) => void;
}

interface Props extends OwnProps {
  schemaAnalysisState: SchemaAnalysisState;
}

const DocumentCountScreen = ({
  documentCount,
  onDocumentCountChange,
  schemaAnalysisState,
}: Props) => {
  const estimatedDiskSize = useMemo(
    () =>
      schemaAnalysisState.status === 'complete' &&
      schemaAnalysisState.schemaMetadata.avgDocumentSize
        ? formatBytes(
            schemaAnalysisState.schemaMetadata.avgDocumentSize * documentCount
          )
        : 'Not available',
    [schemaAnalysisState, documentCount]
  );

  const isOutOfRange = documentCount < 1 || documentCount > MAX_DOCUMENT_COUNT;

  const errorState: ErrorState = useMemo(() => {
    if (isOutOfRange) {
      return {
        state: 'error',
        message: `Document count must be between 1 and ${MAX_DOCUMENT_COUNT}`,
      };
    }
    return {
      state: 'none',
    };
  }, [isOutOfRange]);

  const handleDocumentCountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      onDocumentCountChange(value);
    }
  };

  return schemaAnalysisState.status === 'complete' ? (
    <div>
      <Body className={titleStyles}>
        Specify Number of Documents to Generate
      </Body>
      <Body className={descriptionStyles}>
        Indicate the amount of documents you want to generate below.
        <br />
        Note: We have defaulted to {DEFAULT_DOCUMENT_COUNT}.
      </Body>
      <div className={inputContainerStyles}>
        <TextInput
          label="Documents to generate in current collection"
          type="number"
          value={documentCount.toString()}
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
  ) : (
    // Not reachable since schema analysis must be finished before the modal can be opened
    <div>We are analyzing your collection.</div>
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
