import { faker } from '@faker-js/faker';

import type {
  MockDataGeneratorEvalScorer,
  MockDataGeneratorExpectedField,
  FieldMismatch,
  ScorerMetadata,
} from './types';
import { isEvalCriterion, UNRECOGNIZED_METHOD } from './types';

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
      // choice — using sample data directly is a valid mock data strategy.
      // Only the singular form is accepted since the downstream generator
      // wraps in Array.from({length: N}, ...)
      // FakerSampleValueAccuracy scorer checks the args are correct.
      const fieldHasSampleValues =
        (args.input.providedSchema[fieldName]?.sampleValues?.length ?? 0) > 0;

      if (fieldHasSampleValues && actualValue === 'helpers.arrayElement') {
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

// --- Sample Value Accuracy Scorer ---

/**
 * For fields where the LLM uses helpers.arrayElement/arrayElements, validates
 * that all arg values come from the field's sampleValues in the input schema.
 * Counts as failure when: sampleValues are missing for the field, the array
 * arg is missing/unparseable, or any arg value is not in sampleValues.
 */
export const FakerSampleValueAccuracy = withSkipResultOnUnexpected(
  (args: Parameters<MockDataGeneratorEvalScorer>[0]) => {
    const outputFields = args.output.response.fields;
    const schema = args.input.providedSchema;

    let checked = 0;
    let passed = 0;
    const failures: Array<{
      fieldPath: string;
      reason: string;
      argValues?: unknown[];
      sampleValues?: unknown[];
    }> = [];

    for (const field of outputFields) {
      // arrayElements always produces wrong-typed mock data in Compass's
      // generator (nested arrays for array fields, array values for scalar
      // fields), so flag it as a failure and don't check sampleValues.
      if (field.fakerMethod === 'helpers.arrayElements') {
        checked++;
        failures.push({
          fieldPath: field.fieldPath,
          reason:
            'helpers.arrayElements produces wrong-typed data in the generator; use helpers.arrayElement',
        });
        continue;
      }
      if (field.fakerMethod !== 'helpers.arrayElement') {
        continue;
      }

      checked++;

      const fieldDef = schema[field.fieldPath];
      const sampleValues = (fieldDef?.sampleValues ?? []).filter(
        (v: unknown) => v !== null && v !== undefined
      );

      if (sampleValues.length === 0) {
        failures.push({
          fieldPath: field.fieldPath,
          reason: 'no sampleValues for field',
        });
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
            // fall through to failure
          }
        }
      }

      if (!argValues) {
        failures.push({
          fieldPath: field.fieldPath,
          reason: 'missing or unparseable array arg',
        });
        continue;
      }

      // Every arg value must appear in sampleValues (exact match).
      const sampleSet = new Set<unknown>(sampleValues);
      const allMatch = argValues.every((v: unknown) => sampleSet.has(v));

      if (allMatch) {
        passed++;
      } else {
        failures.push({
          fieldPath: field.fieldPath,
          reason: 'arg values not in sampleValues',
          argValues,
          sampleValues,
        });
      }
    }

    if (checked === 0) {
      return {
        name: 'FakerSampleValueAccuracy',
        score: 1,
      };
    }

    return {
      name: 'FakerSampleValueAccuracy',
      score: passed / checked,
      metadata: {
        checked,
        passed,
        failures,
      },
    };
  }
);
