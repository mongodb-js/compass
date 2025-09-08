import React from 'react';
import { connect } from 'react-redux';

import { Code, Body, Subtitle } from '@mongodb-js/compass-components';

import type { CollectionState } from '../../modules/collection-tab';
import type { FieldInfo } from '../../schema-analysis-types';

interface RawSchemaConfirmationProps {
  schemaContent: Record<string, FieldInfo> | null;
  namespace: string;
}

// Note: Currently a placeholder. The final contents will be addressed by CLOUDP-333852
const RawSchemaConfirmation = (props: RawSchemaConfirmationProps) => {
  // this will change
  const codeContent = props.schemaContent
    ? JSON.stringify(props.schemaContent, null, 4)
    : 'No schema data available';

  return (
    <div data-testid="raw-schema-confirmation">
      <Body>{props.namespace}</Body>
      <Subtitle>Document Schema Identified</Subtitle>
      <Body>
        We have identified the following schema from your documents. This schema
        will be sent to an LLM for processing.
      </Body>
      <Code language="javascript" copyable={false}>
        {codeContent}
      </Code>
    </div>
  );
};

const mapStateToProps = (state: CollectionState) => {
  const schemaContent =
    state.schemaAnalysis.status === 'complete'
      ? state.schemaAnalysis.processedSchema
      : null;
  return {
    schemaContent,
    namespace: state.namespace,
  };
};

const ConnectedRawSchemaConfirmation = connect(
  mapStateToProps,
  {}
)(RawSchemaConfirmation);

export default ConnectedRawSchemaConfirmation;
