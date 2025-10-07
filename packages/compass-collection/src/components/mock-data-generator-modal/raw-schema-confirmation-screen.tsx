import React from 'react';
import { connect } from 'react-redux';

import {
  css,
  palette,
  spacing,
  Banner,
  BannerVariant,
  Body,
  DocumentList,
  useDarkMode,
} from '@mongodb-js/compass-components';

import { usePreference } from 'compass-preferences-model/provider';
import toSimplifiedFieldInfo from './to-simplified-field-info';
import type { CollectionState } from '../../modules/collection-tab';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import type { MockDataGeneratorState } from './types';
import HadronDocument from 'hadron-document';

interface RawSchemaConfirmationScreenProps {
  schemaAnalysis: SchemaAnalysisState;
  fakerSchemaGenerationStatus: MockDataGeneratorState['status'];
}

const getDocumentContainerStyles = (isDarkMode: boolean) =>
  css({
    backgroundColor: isDarkMode ? palette.gray.dark3 : palette.gray.light3,
    border: `1px solid ${
      isDarkMode ? palette.gray.dark2 : palette.gray.light2
    }`,
    borderRadius: spacing[400],
  });

const documentStyles = css({
  padding: `${spacing[400]}px ${spacing[900]}px`,
});

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const errorBannerStyles = css({
  marginTop: spacing[400],
});

const errorBannerTextStyles = css({
  color: palette.red.dark2,
});

const RawSchemaConfirmationScreen = ({
  schemaAnalysis,
  fakerSchemaGenerationStatus,
}: RawSchemaConfirmationScreenProps) => {
  const enableSampleDocumentPassing = usePreference(
    'enableGenAISampleDocumentPassing'
  );
  const isDarkMode = useDarkMode();

  const subtitleText = enableSampleDocumentPassing
    ? 'Sample Documents Collected'
    : 'Document Schema Identified';

  const descriptionText = enableSampleDocumentPassing
    ? 'A sample of documents from your collection will be sent to an LLM for processing.'
    : 'We have identified the following schema from your documents. This schema will be sent to an LLM for processing.';

  return (
    <div data-testid="raw-schema-confirmation">
      {schemaAnalysis.status === 'complete' ? (
        <>
          <Body as="h2" baseFontSize={16} weight="medium">
            {subtitleText}
          </Body>
          <Body className={descriptionStyles}>{descriptionText}</Body>
          <div className={getDocumentContainerStyles(!!isDarkMode)}>
            <DocumentList.Document
              className={documentStyles}
              editable={false}
              value={
                new HadronDocument(
                  enableSampleDocumentPassing
                    ? schemaAnalysis.sampleDocument
                    : toSimplifiedFieldInfo(schemaAnalysis.processedSchema)
                )
              }
            />
          </div>
          {fakerSchemaGenerationStatus === 'error' && (
            <Banner
              variant={BannerVariant.Danger}
              className={errorBannerStyles}
            >
              <Body className={errorBannerTextStyles}>
                LLM Request failed. Please confirm again.
              </Body>
            </Banner>
          )}
        </>
      ) : (
        // Not reachable since schema analysis must be finished before the modal can be opened
        <Body>We are analyzing your collection.</Body>
      )}
    </div>
  );
};

const mapStateToProps = (state: CollectionState) => {
  const schemaAnalysis = state.schemaAnalysis;
  const fakerSchemaGenerationStatus = state.fakerSchemaGeneration.status;

  return {
    schemaAnalysis,
    fakerSchemaGenerationStatus,
  };
};

const ConnectedRawSchemaConfirmationScreen = connect(
  mapStateToProps,
  {}
)(RawSchemaConfirmationScreen);

export default ConnectedRawSchemaConfirmationScreen;
