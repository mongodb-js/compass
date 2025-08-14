import React, { useMemo } from 'react';
import { Body, Code, css, spacing, H3 } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import type { Document } from 'mongodb';
import type {
  Schema,
  SchemaField,
  DocumentSchemaType,
  ArraySchemaType,
} from 'mongodb-schema';

const containerStyles = css({
  padding: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
});

const sectionStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const codeContainerStyles = css({
  maxHeight: '300px',
  overflow: 'auto',
});

interface ConfirmationScreenProps {
  namespace: string;
  schema: Schema;
  sampleDocument: Document;
}

/**
 * Formats a schema to show only field types (no real values)
 */
function formatSchemaTypesOnly(schema: Schema): string {
  const result: Record<string, string> = {};

  const processField = (field: SchemaField, path = ''): void => {
    const fieldPath = path ? `${path}.${field.name}` : field.name;
    const primaryType = field.types?.[0];

    if (!primaryType) return;

    switch (primaryType.bsonType) {
      case 'Document': {
        result[fieldPath] = 'Object';
        (primaryType as DocumentSchemaType).fields?.forEach((f: SchemaField) =>
          processField(f, fieldPath)
        );
        break;
      }
      case 'Array': {
        const elementType = (primaryType as ArraySchemaType).types?.[0];
        if (elementType?.bsonType === 'Document') {
          result[fieldPath] = 'Array<Object>';
          (elementType as DocumentSchemaType).fields?.forEach(
            (f: SchemaField) => processField(f, fieldPath)
          );
        } else {
          result[fieldPath] = `Array<${elementType?.bsonType || 'Mixed'}>`;
        }
        break;
      }
      default:
        result[fieldPath] = primaryType.bsonType || 'Mixed';
    }
  };

  schema.fields?.forEach((field) => processField(field));
  return JSON.stringify(result, null, 2);
}

/**
 * Formats a sample document for display
 */
function formatSampleDocument(sampleDocument: Document): string {
  return JSON.stringify(sampleDocument, null, 2);
}

export const ConfirmationScreen: React.FunctionComponent<
  ConfirmationScreenProps
> = ({ namespace, schema, sampleDocument }) => {
  const enableSampleDocumentPassing = usePreference(
    'enableGenAISampleDocumentPassingOnAtlasProject'
  );

  const displayContent = useMemo(() => {
    return enableSampleDocumentPassing
      ? formatSampleDocument(sampleDocument)
      : formatSchemaTypesOnly(schema);
  }, [enableSampleDocumentPassing, sampleDocument, schema]);

  const sectionTitle = enableSampleDocumentPassing
    ? 'Sample Documents Collected'
    : 'Document Schema Identified';

  const sectionDescription = enableSampleDocumentPassing
    ? 'A sample of document values from your collection will be sent to an LLM for processing.'
    : 'We have identified the following schema from your documents. This schema will be sent to an LLM for processing.';

  return (
    <div className={containerStyles}>
      <Body>{namespace}</Body>

      <div className={sectionStyles}>
        <H3>{sectionTitle}</H3>
        <Body>{sectionDescription}</Body>

        <div className={codeContainerStyles}>
          <Code language="json" copyable={false}>
            {displayContent}
          </Code>
        </div>
      </div>
    </div>
  );
};
