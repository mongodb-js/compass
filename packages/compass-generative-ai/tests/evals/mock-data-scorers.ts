import type { MockDataEvalScorer } from './types';
import { faker } from '@faker-js/faker/locale/en';

export const FieldCoverage: MockDataEvalScorer = ({ input, output }) => {
  const inputFields = Object.keys(input.schema);
  if (inputFields.length === 0) return { name: 'FieldCoverage', score: 1 };

  const outputFieldPaths = new Set(output.fields.map((f) => f.fieldPath));
  const covered = inputFields.filter((f) => outputFieldPaths.has(f)).length;

  return {
    name: 'FieldCoverage',
    score: covered / inputFields.length,
    metadata: {
      totalInputFields: inputFields.length,
      coveredFields: covered,
      missingFields: inputFields.filter((f) => !outputFieldPaths.has(f)),
    },
  };
};

function isValidFakerMethod(method: string): boolean {
  if (method === 'unrecognized') return true;

  const parts = method.split('.');
  if (parts.length !== 2) return false;

  const [moduleName, methodName] = parts;
  const fakerModule = (faker as unknown as Record<string, unknown>)[moduleName];

  if (!fakerModule || typeof fakerModule !== 'object') return false;
  return (
    typeof (fakerModule as Record<string, unknown>)[methodName] === 'function'
  );
}

export const FakerMethodValidity: MockDataEvalScorer = ({ output }) => {
  if (output.fields.length === 0)
    return { name: 'FakerMethodValidity', score: 1 };

  const results = output.fields.map((field) =>
    isValidFakerMethod(field.fakerMethod)
  );
  const validCount = results.filter(Boolean).length;

  return {
    name: 'FakerMethodValidity',
    score: validCount / output.fields.length,
    metadata: {
      totalFields: output.fields.length,
      validMethods: validCount,
      invalidMethods: output.fields
        .filter((_, i) => !results[i])
        .map((f) => f.fakerMethod),
    },
  };
};

export const FakerMethodRelevance: MockDataEvalScorer = ({
  output,
  expected,
}) => {
  if (expected.fieldMappings.length === 0)
    return { name: 'FakerMethodRelevance', score: 1 };

  const outputByPath = new Map(
    output.fields.map((f) => [f.fieldPath, f] as const)
  );

  let matchCount = 0;
  const details: Array<{
    fieldPath: string;
    actual: string;
    matched: boolean;
  }> = [];

  for (const mapping of expected.fieldMappings) {
    const outputField = outputByPath.get(mapping.fieldPath);
    if (!outputField) {
      details.push({
        fieldPath: mapping.fieldPath,
        actual: 'MISSING',
        matched: false,
      });
      continue;
    }

    const matched = mapping.acceptableMethods.some((pattern) =>
      new RegExp(`^${pattern}$`).test(outputField.fakerMethod)
    );

    if (matched) matchCount++;
    details.push({
      fieldPath: mapping.fieldPath,
      actual: outputField.fakerMethod,
      matched,
    });
  }

  return {
    name: 'FakerMethodRelevance',
    score: matchCount / expected.fieldMappings.length,
    metadata: { details },
  };
};
