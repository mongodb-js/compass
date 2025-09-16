import React, { useMemo } from 'react';
import { css, spacing, Body, Code } from '@mongodb-js/compass-components';
import type { ValidatedFakerSchemaMapping } from './types';
import { faker } from '@faker-js/faker/locale/en';
import { FIELD_NAME_SEPARATOR } from '../../transform-schema-to-field-info';

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const UNRECOGNIZED_FAKER_METHOD = 'Unrecognized';

// TODO(CLOUDP-333857): borrow from `script-generation-utils` to convert to a nested document structure (and especially handle [] markers)
function createDocumentFactory(fakerSchema: ValidatedFakerSchemaMapping[]) {
  return () => {
    const flatDocument: Record<string, string | number | boolean | null> = {};

    for (const field of fakerSchema) {
      const { fieldPath, fakerMethod, fakerArgs } = field;

      if (fakerMethod === UNRECOGNIZED_FAKER_METHOD) {
        flatDocument[fieldPath] = null;
        continue;
      }

      try {
        // e.g., "person.firstName" -> ["person", "firstName"])
        const [moduleName, methodName] = fakerMethod.split('.');

        // This check should not fail if fakerSchema is validated properly
        if (typeof (faker as any)[moduleName]?.[methodName] !== 'function') {
          flatDocument[fieldPath] = null;
          continue;
        }

        // Process faker arguments
        const processedArgs = fakerArgs.map((arg) => {
          if (typeof arg === 'object' && arg !== null && 'json' in arg) {
            try {
              return JSON.parse(arg.json);
            } catch {
              return arg.json;
            }
          }
          return arg;
        });

        // Call the faker method with processed arguments
        const fakerModule = (faker as any)[moduleName];
        flatDocument[fieldPath] = fakerModule[methodName](...processedArgs);
      } catch (error) {
        // If there's any error generating the value, set it to null
        flatDocument[fieldPath] = null;
      }
    }

    return flatDocument;
  };
}

interface PreviewScreenProps {
  confirmedFakerSchema: ValidatedFakerSchemaMapping[];
}

const NUM_SAMPLE_DOCUMENTS = 5;

function PreviewScreen({ confirmedFakerSchema }: PreviewScreenProps) {
  const sampleDocuments = useMemo(() => {
    const documentFactory = createDocumentFactory(confirmedFakerSchema);

    const documents = [];
    for (let i = 0; i < NUM_SAMPLE_DOCUMENTS; i++) {
      documents.push(documentFactory());
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
