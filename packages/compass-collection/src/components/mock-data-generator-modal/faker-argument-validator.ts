// @ts-expect-error TypeScript warns us about importing ESM module from CommonJS module, but we can ignore since this code will be consumed by webpack.
import { faker } from '@faker-js/faker/locale/en';

export interface FakerArgumentValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedArgs?: unknown[];
  executionTimeMs?: number;
}

export interface FakerValidationOptions {
  timeoutMs?: number;
  logPerformance?: boolean;
  logger?: { debug: (message: string) => void };
}

/**
 * Validates faker.js method arguments by attempting to execute the method.
 * This is safe because we've already validated that the faker method exists.
 *
 * @param fakerMethod - The faker method (e.g., "string.alpha", "number.int")
 * @param args - The arguments to validate
 * @param options - Validation options including timeout and performance logging
 * @returns Validation result with success/error information
 */
export function validateFakerArguments(
  fakerMethod: string,
  args: unknown[],
  options: FakerValidationOptions = {}
): FakerArgumentValidationResult {
  try {
    // Parse the faker method path
    const methodParts = fakerMethod.split('.');
    if (methodParts.length !== 2) {
      return {
        isValid: false,
        error: 'Invalid faker method format. Expected "category.method"',
      };
    }

    const [category, method] = methodParts;

    // Get the faker function - we know faker exists and has these properties
    const fakerCategory = (
      faker as unknown as Record<string, Record<string, unknown>>
    )[category];
    if (!fakerCategory || typeof fakerCategory[method] !== 'function') {
      return {
        isValid: false,
        error: `Faker method ${fakerMethod} does not exist`,
      };
    }

    const fakerFunction = fakerCategory[method] as (
      ...args: unknown[]
    ) => unknown;

    // Attempt to execute the function with the provided arguments
    // Use configurable timeout - default 100ms is sufficient for most faker operations
    const configuredTimeoutMs = options.timeoutMs ?? 100;
    const startTime = Date.now();

    try {
      // Execute the faker function - we don't need the result, just want to validate args
      fakerFunction.apply(fakerCategory, args);

      // Check execution time and log if requested
      const executionTime = Date.now() - startTime;

      if (options.logPerformance && options.logger) {
        options.logger.debug(
          `Faker validation: ${fakerMethod} took ${executionTime}ms`
        );
      }

      if (executionTime > configuredTimeoutMs) {
        return {
          isValid: false,
          error: `Faker method execution took too long (${executionTime}ms). Arguments may be too large.`,
          executionTimeMs: executionTime,
        };
      }

      // Validation successful
      return {
        isValid: true,
        sanitizedArgs: args,
        executionTimeMs: executionTime,
      };
    } catch (executionError) {
      // Faker.js threw an error - this means invalid arguments
      const errorMessage =
        executionError instanceof Error
          ? executionError.message
          : 'Unknown execution error';

      return {
        isValid: false,
        error: `Invalid arguments for ${fakerMethod}: ${errorMessage}`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  } catch (error) {
    // Unexpected error during validation
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown validation error';
    return {
      isValid: false,
      error: `Validation error: ${errorMessage}`,
    };
  }
}

/**
 * Validates and sanitizes a complete faker schema mapping.
 *
 * @param mapping - The faker schema mapping to validate
 * @returns Updated mapping with validated arguments or error information
 */
export function validateFakerSchemaMapping(mapping: {
  fieldPath: string;
  fakerMethod: string;
  fakerArgs: unknown[];
  mongoType: string;
  isArray: boolean;
  probability: number;
}): {
  fieldPath: string;
  fakerMethod: string;
  fakerArgs: unknown[];
  mongoType: string;
  isArray: boolean;
  probability: number;
  validationError?: string;
} {
  // Skip validation for unrecognized methods
  if (mapping.fakerMethod === 'Unrecognized') {
    return mapping;
  }

  const validation = validateFakerArguments(
    mapping.fakerMethod,
    mapping.fakerArgs
  );

  if (!validation.isValid) {
    return {
      ...mapping,
      fakerArgs: [], // Clear invalid arguments
      validationError: validation.error,
    };
  }

  return {
    ...mapping,
    fakerArgs: validation.sanitizedArgs || mapping.fakerArgs,
  };
}

/**
 * Batch validates multiple faker schema mappings.
 *
 * @param mappings - Array of faker schema mappings to validate
 * @returns Array of validated mappings with any validation errors noted
 */
export function validateFakerSchemaMappings(
  mappings: Array<{
    fieldPath: string;
    fakerMethod: string;
    fakerArgs: unknown[];
    mongoType: string;
    isArray: boolean;
    probability: number;
  }>
): Array<{
  fieldPath: string;
  fakerMethod: string;
  fakerArgs: unknown[];
  mongoType: string;
  isArray: boolean;
  probability: number;
  validationError?: string;
}> {
  return mappings.map(validateFakerSchemaMapping);
}
