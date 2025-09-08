import React from 'react';
import { connect } from 'react-redux';

import {
  css,
  palette,
  spacing,
  Banner,
  BannerVariant,
  Code,
  Body,
  Subtitle,
} from '@mongodb-js/compass-components';

import { usePreference } from 'compass-preferences-model/provider';
import toUserFriendlyFieldInfo from './to-user-friendly-field-info';
import type { CollectionState } from '../../modules/collection-tab';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import type { MockDataGeneratorState } from './types';

interface RawSchemaConfirmationScreenProps {
  schemaAnalysis: SchemaAnalysisState;
  namespace: string;
  fakerSchemaGenerationStatus: MockDataGeneratorState['status'];
}

const namespaceStyles = css({
  marginTop: spacing[100],
  marginBottom: spacing[500],
});

const headingStyles = css({
  marginBottom: spacing[100],
});

const descriptionStyles = css({
  marginBottom: spacing[300],
});

const codeStyles = css({
  maxHeight: '30vh',
});

const errorBannerStyles = css({
  marginTop: spacing[400],
});

const errorBannerTextStyles = css({
  color: palette.red.dark2,
});

// Note: Currently a placeholder. The final contents will be addressed by CLOUDP-333852
const RawSchemaConfirmationScreen = (
  props: RawSchemaConfirmationScreenProps
) => {
  let enableSampleDocumentPassing = usePreference(
    'enableGenAISampleDocumentPassing'
  );

  const subtitleText = enableSampleDocumentPassing
    ? 'Sample Documents Collected'
    : 'Document Schema Identified';

  const descriptionText = enableSampleDocumentPassing
    ? 'A sample of document values from your collection will be sent to an LLM for processing.'
    : 'We have identified the following schema from your documents. This schema will be sent to an LLM for processing.';

  // todo: should establish if unfinished schema analysis edge case should be handled within the modal or
  // from the button opening the modal
  const schemaAnalysisIncompletePlaceholder = (
    <Body>Schema analysis has yet to complete successfully.</Body>
  );

  return (
    <div data-testid="raw-schema-confirmation">
      {props.schemaAnalysis.status === 'complete' ? (
        <>
          <Body className={namespaceStyles}>{props.namespace}</Body>
          <Body
            as="h2"
            className={headingStyles}
            baseFontSize={16}
            weight="medium"
          >
            {subtitleText}
          </Body>
          <Body className={descriptionStyles}>{descriptionText}</Body>
          <Code language="javascript" copyable={false} className={codeStyles}>
            {enableSampleDocumentPassing
              ? JSON.stringify(props.schemaAnalysis.sampleDocument, null, 4)
              : JSON.stringify(
                  toUserFriendlyFieldInfo(props.schemaAnalysis.processedSchema),
                  null,
                  4
                )}
          </Code>
          {props.fakerSchemaGenerationStatus === 'error' && (
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
        schemaAnalysisIncompletePlaceholder
      )}
    </div>
  );
};

const mapStateToProps = (state: CollectionState) => {
  const schemaAnalysis = state.schemaAnalysis;
  const fakerSchemaGenerationStatus = state.fakerSchemaGeneration.status;

  return {
    schemaAnalysis,
    namespace: state.namespace,
    fakerSchemaGenerationStatus,
  };
};

const ConnectedRawSchemaConfirmationScreen = connect(
  mapStateToProps,
  {}
)(RawSchemaConfirmationScreen);

export default ConnectedRawSchemaConfirmationScreen;
