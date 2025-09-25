import {
  Body,
  css,
  palette,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { CollectionState } from '../../modules/collection-tab';
import { SchemaAnalysisState } from '../../schema-analysis-types';
import numeral from 'numeral';
import { DEFAULT_DOCUMENT_COUNT, MAX_DOCUMENT_COUNT } from './constants';

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
  const precision = bytes <= 1000 ? '0' : '0.0';
  return numeral(bytes).format(precision + 'b');
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
  const estimatedDiskSize = useMemo(() => {
    return schemaAnalysisState.status === 'complete'
      ? schemaAnalysisState.schemaMetadata.avgDocumentSize * documentCount
      : 0;
  }, [schemaAnalysisState, documentCount]);

  const errorState = useMemo(() => {
    return documentCount < 1 || documentCount > MAX_DOCUMENT_COUNT
      ? 'error'
      : 'none';
  }, [documentCount]);

  const errorMessage = useMemo(() => {
    return documentCount < 1 || documentCount > MAX_DOCUMENT_COUNT
      ? 'Document count must be between 1 and 100000'
      : undefined;
  }, [documentCount]);

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
          onChange={(e) => onDocumentCountChange(Number(e.target.value))}
          min={1}
          max={MAX_DOCUMENT_COUNT}
          state={errorState}
          errorMessage={errorMessage}
        />
        <div>
          <Body className={boldStyles}>Estimated Disk Size</Body>
          <Body className={estimatedDiskSizeStyles}>
            {formatBytes(estimatedDiskSize)}
          </Body>
        </div>
      </div>
    </div>
  ) : (
    // Not reachable since schema analysis must be finished before the modal can be opened
    <div>We are analyzing your collection.</div>
  );
};

const mapStateToProps = (state: CollectionState, _ownProps: OwnProps) => {
  const schemaAnalysisState = state.schemaAnalysis;

  return {
    schemaAnalysisState,
  };
};

const ConnectedDocumentCountScreen = connect(
  mapStateToProps,
  {}
)(DocumentCountScreen);

export default ConnectedDocumentCountScreen;
