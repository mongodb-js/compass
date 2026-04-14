import { faker } from '@faker-js/faker';

import type {
  MockDataGeneratorEvalScorer,
  MockDataGeneratorExpectedField,
  FieldMismatch,
  ScorerMetadata,
} from './types';
import {
  isEvalCriterion,
  UNRECOGNIZED_METHOD,
  type MockDataInputFieldSchema,
} from './types';

// --- Scorer Wrapper ---

/**
 * Wraps a scorer to skip scoring when an `UNEXPECTED_EVAL_ERROR` occurs,
 * preventing misleading zero scores from being recorded.
 */
function withSkipResultOnUnexpected(
  scorer: MockDataGeneratorEvalScorer
): MockDataGeneratorEvalScorer {
  return async (args) => {
    if (args.output.response.errorType === 'UNEXPECTED_EVAL_ERROR') {
      return null; // omits scoring
    }
    return scorer(args);
  };
}

// --- Field Scorers ---

type FieldValueExtractor = (
  field: MockDataGeneratorExpectedField
) => MockDataGeneratorExpectedField['fakerMethod'];

function createFieldScorer(
  name: string,
  valueExtractor: FieldValueExtractor
): MockDataGeneratorEvalScorer {
  return (args) => {
    let matches = 0;
    const fieldMismatches: Array<FieldMismatch> = [];
    const missingFields: Array<string> = [];

    const schemaFieldNames = Object.keys(args.input.providedSchema);
    const totalFields = schemaFieldNames.length;

    const expectedOutputMap = new Map(
      args.expected.response.fields.map((field) => [field.fieldPath, field])
    );
    const actualOutputMap = new Map(
      args.output.response.fields.map((field) => [field.fieldPath, field])
    );

    for (const fieldName of schemaFieldNames) {
      const expectedField = expectedOutputMap.get(fieldName);
      const actualField = actualOutputMap.get(fieldName);

      if (!expectedField || !actualField) {
        missingFields.push(fieldName);
        continue;
      }

      const expectedValue = valueExtractor(expectedField);
      const actualValue = valueExtractor(actualField) as string;

      // When the field has sampleValues, helpers.arrayElement is a valid
      // choice: using sample data directly is a valid mock data strategy.
      // ArrayElementArgAccuracy scorer checks the args are correct.
      const fieldHasSampleValues =
        (args.input.providedSchema[fieldName]?.sampleValues?.length ?? 0) > 0;

      if (
        fieldHasSampleValues &&
        (actualValue === 'helpers.arrayElement' ||
          actualValue === 'helpers.arrayElements')
      ) {
        matches++;
      } else if (
        isEvalCriterion(expectedValue) &&
        expectedValue.satisfiedBy(actualValue)
      ) {
        matches++;
      } else if (expectedValue === actualValue) {
        matches++;
      } else {
        fieldMismatches.push({
          field: fieldName,
          expected: isEvalCriterion(expectedValue)
            ? expectedValue.name
            : expectedValue,
          generated: actualValue,
        });
      }
    }

    const metadata: ScorerMetadata = {
      totalFields,
      matches,
      missingFields,
      fieldMismatches,
    };

    return {
      name,
      score: totalFields > 0 ? matches / totalFields : 0,
      metadata,
    };
  };
}

export const FakerFieldNameAccuracy = withSkipResultOnUnexpected(
  createFieldScorer(
    'FakerFieldNameAccuracy',
    (field: MockDataGeneratorExpectedField) => field.fieldPath
  )
);

export const FakerMethodSuggestionAccuracy = withSkipResultOnUnexpected(
  createFieldScorer(
    'FakerMethodSuggestionAccuracy',
    (field: MockDataGeneratorExpectedField) => field.fakerMethod
  )
);

// --- Percent Recognized Scorer ---

export const PercentRecognizedScorer = withSkipResultOnUnexpected(
  (args: Parameters<MockDataGeneratorEvalScorer>[0]) => {
    const outputFields = args.output.response.fields;
    const totalFields = outputFields.length;

    const unrecognizedFields = outputFields.filter(
      (field) => field.fakerMethod === UNRECOGNIZED_METHOD
    );
    const unrecognizedFieldCount = unrecognizedFields.length;
    const unrecognizedFieldPaths = unrecognizedFields.map(
      (field) => field.fieldPath
    );

    return {
      name: 'FakerFieldPercentRecognized',
      score:
        totalFields > 0
          ? (totalFields - unrecognizedFieldCount) / totalFields
          : 0,
      metadata: {
        totalFields,
        unrecognizedFieldCount,
        unrecognizedFields,
        unrecognizedFieldPaths,
      },
    };
  }
);

// --- Arg Parseable Scorer ---

export const FakerArgParseableScorer = withSkipResultOnUnexpected(
  (args: Parameters<MockDataGeneratorEvalScorer>[0]) => {
    const outputFields = args.output.response.fields;

    let fakerArgCount = 0;
    let passCount = 0;
    const pathsWithDiscrepancies: Set<string> = new Set();
    for (const field of outputFields) {
      for (const arg of field.fakerArgs) {
        if (typeof arg === 'object' && 'json' in arg) {
          fakerArgCount++;
          try {
            const parsed = JSON.parse(arg.json);

            if (
              Array.isArray(parsed) ||
              (typeof parsed === 'object' && parsed !== null)
            ) {
              passCount++;
            } else {
              pathsWithDiscrepancies.add(field.fieldPath);
            }
          } catch {
            pathsWithDiscrepancies.add(field.fieldPath);
            continue;
          }
        }
      }
    }

    if (fakerArgCount === 0) {
      return {
        name: 'FakerArgParseableScorer',
        score: 1,
      };
    }

    return {
      name: 'FakerArgParseableScorer',
      score: passCount ? passCount / fakerArgCount : 0,
      metadata: {
        fakerArgCount,
        passCount,
        pathsWithDiscrepancies: Array.from(pathsWithDiscrepancies),
      },
    };
  }
);

// --- Method Runnable Scorer ---

export const MethodRunnableScorer = withSkipResultOnUnexpected(
  (args: Parameters<MockDataGeneratorEvalScorer>[0]) => {
    const recognizedOutputFields = args.output.response.fields.filter(
      (field) => field.fakerMethod !== UNRECOGNIZED_METHOD
    );

    const totalRecognizedMethods = recognizedOutputFields.length;
    let nonexistentMethods = 0;
    let nonrunnableMethods = 0;

    for (const field of recognizedOutputFields) {
      const [module, method] = field.fakerMethod.split('.');

      // @ts-expect-error TS(7053)
      const fakerMethod: unknown = faker?.[module]?.[method];
      if (typeof fakerMethod !== 'function') {
        nonexistentMethods++;
        nonrunnableMethods++;
        continue;
      }

      try {
        const parsedArgs: unknown[] = field.fakerArgs.map((arg) => {
          if (typeof arg === 'object' && 'json' in arg) {
            return JSON.parse(arg.json);
          }
          return arg;
        });

        (fakerMethod as (...a: unknown[]) => unknown)(...parsedArgs);
      } catch {
        nonrunnableMethods++;
      }
    }

    return {
      name: 'FakerMethodRunnableScorer',
      score: totalRecognizedMethods
        ? (totalRecognizedMethods - nonrunnableMethods) / totalRecognizedMethods
        : 0,
      metadata: {
        totalRecognizedMethods,
        nonexistentMethods,
        nonrunnableMethods,
      },
    };
  }
);

// --- Array Element Arg Accuracy Scorer ---

/**
 * When the LLM uses helpers.arrayElement/arrayElements, validates that the
 * array arg contains values derived from the field's sampleValues in the
 * input schema. Skips fields that have no sampleValues or don't use
 * helpers.arrayElement/arrayElements.
 */
function parseSampleValues(
  schema: MockDataInputFieldSchema,
  fieldPath: string
): unknown[] | null {
  const fieldDef = schema[fieldPath];
  if (!fieldDef?.sampleValues || fieldDef.sampleValues.length === 0) {
    return null;
  }
  return fieldDef.sampleValues.filter(
    (v: unknown) => v !== null && v !== undefined
  );
}

export const ArrayElementArgAccuracy = withSkipResultOnUnexpected(
  (args: Parameters<MockDataGeneratorEvalScorer>[0]) => {
    const outputFields = args.output.response.fields;
    const schema = args.input.providedSchema;

    let checked = 0;
    let passed = 0;
    const failures: Array<{
      fieldPath: string;
      argValues: unknown[];
      sampleValues: unknown[];
    }> = [];

    for (const field of outputFields) {
      if (
        field.fakerMethod !== 'helpers.arrayElement' &&
        field.fakerMethod !== 'helpers.arrayElements'
      ) {
        continue;
      }

      const sampleValues = parseSampleValues(schema, field.fieldPath);
      if (!sampleValues) {
        continue;
      }

      // Extract the array arg (first json arg that parses to an array)
      let argValues: unknown[] | null = null;
      for (const arg of field.fakerArgs) {
        if (typeof arg === 'object' && 'json' in arg) {
          try {
            const parsed: unknown = JSON.parse(arg.json);
            if (Array.isArray(parsed)) {
              argValues = parsed;
              break;
            }
          } catch {
            // skip unparseable
          }
        }
      }

      if (!argValues) {
        continue;
      }

      checked++;

      // Check that the arg array has overlap with sample values.
      // Case-insensitive for strings since the LLM may normalize casing.
      const sampleSet = new Set(
        sampleValues.map((v: unknown) =>
          typeof v === 'string' ? v.toLowerCase() : v
        )
      );
      const matchCount = argValues.filter((v: unknown) =>
        sampleSet.has(typeof v === 'string' ? v.toLowerCase() : v)
      ).length;

      if (matchCount > 0) {
        passed++;
      } else {
        failures.push({
          fieldPath: field.fieldPath,
          argValues,
          sampleValues,
        });
      }
    }

    if (checked === 0) {
      return {
        name: 'ArrayElementArgAccuracy',
        score: 1,
      };
    }

    return {
      name: 'ArrayElementArgAccuracy',
      score: passed / checked,
      metadata: {
        checked,
        passed,
        failures,
      },
    };
  }
);
