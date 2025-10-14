import { type Logger, mongoLogId } from '@mongodb-js/compass-logging/provider';
import type { FakerArg } from './script-generation-utils';
import { faker } from '@faker-js/faker/locale/en';

const MAX_FAKER_ARGS_COUNT = 2;
const MAX_ARRAY_LENGTH = 10;
const MAX_FAKER_STRING_LENGTH = 1000;
const MAX_FAKER_ARGS_DEPTH = 3;
const MAX_FAKER_NUMBER_SIZE = 10000;

/**
 * Checks if the provided faker arguments are valid.
 * - Numbers must be finite
 * - Strings must not exceed max length
 * - Arrays must not exceed max length and all elements must be valid
 * - Objects must have a 'json' property that is a valid JSON string and all values must be valid
 */
export function areFakerArgsValid(
  fakerArgs: FakerArg[],
  depth: number = 0
): boolean {
  if (depth > MAX_FAKER_ARGS_DEPTH) {
    return false;
  }
  if (fakerArgs.length === 0) {
    return true;
  }
  // Check top-level argument count (max 2 for faker functions)
  if (depth === 0 && fakerArgs.length > MAX_FAKER_ARGS_COUNT) {
    return false;
  }
  // Check array length for nested arrays
  if (depth > 0 && fakerArgs.length > MAX_ARRAY_LENGTH) {
    return false;
  }
  for (const arg of fakerArgs) {
    if (arg === null || arg === undefined) {
      return false;
    } else if (typeof arg === 'boolean') {
      // booleans are always valid, continue
      continue;
    } else if (typeof arg === 'number') {
      if (!Number.isFinite(arg) || Math.abs(arg) > MAX_FAKER_NUMBER_SIZE) {
        return false;
      }
    } else if (typeof arg === 'string') {
      if (arg.length > MAX_FAKER_STRING_LENGTH) {
        return false;
      }
    } else if (Array.isArray(arg)) {
      if (!areFakerArgsValid(arg, depth + 1)) {
        return false;
      }
    } else if (
      typeof arg === 'object' &&
      arg !== null &&
      'json' in arg &&
      typeof arg.json === 'string'
    ) {
      try {
        const parsedJson = JSON.parse(arg.json);
        if (!areFakerArgsValid(Object.values(parsedJson), depth + 1)) {
          return false;
        }
      } catch {
        return false;
      }
    } else {
      // Unrecognized argument type
      return false;
    }
  }
  return true;
}

/**
 * Checks if the method exists and is callable on the faker object.
 *
 * Note: Only supports the format `module.method` (e.g., `internet.email`).
 * - Nested modules are not supported.
 * - Most methods in the `helpers` module are not supported due to their complex argument requirements. @see {@link https://fakerjs.dev/api/helpers.html}
 * - If the method call with provided args fails, it retries without args before marking as invalid.
 *
 * @see {@link https://fakerjs.dev/api/}
 */
export function isValidFakerMethod(
  fakerMethod: string,
  fakerArgs: FakerArg[],
  logger: Logger
): {
  isValid: boolean;
  fakerArgs: FakerArg[];
} {
  const moduleAndMethod = getFakerModuleAndMethod(fakerMethod);
  if (!moduleAndMethod) {
    return { isValid: false, fakerArgs: [] };
  }
  const { moduleName, methodName, fakerModule } = moduleAndMethod;

  if (
    isAllowedFakerFn(moduleName, methodName) &&
    canInvokeFakerMethod(fakerModule, methodName)
  ) {
    const callableFakerMethod = (
      fakerModule as Record<string, (...args: any[]) => any>
    )[methodName];
    return tryInvokeFakerMethod(
      callableFakerMethod,
      fakerMethod,
      fakerArgs,
      logger
    );
  } else {
    return { isValid: false, fakerArgs: [] };
  }
}

function getFakerModuleAndMethod(method: string) {
  const parts = method.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [moduleName, methodName] = parts;
  const fakerModule = (faker as unknown as Record<string, unknown>)[moduleName];
  return { moduleName, methodName, fakerModule };
}

function isAllowedFakerFn(moduleName: string, methodName: string) {
  if (moduleName !== 'helpers') {
    // Non-helper modules are allowed
    return true;
  } else {
    // If helpers module, only array helpers are allowed
    return methodName === 'arrayElement' || methodName === 'arrayElements';
  }
}

function canInvokeFakerMethod(fakerModule: unknown, methodName: string) {
  return (
    fakerModule !== null &&
    fakerModule !== undefined &&
    typeof fakerModule === 'object' &&
    typeof (fakerModule as Record<string, unknown>)[methodName] === 'function'
  );
}

function tryInvokeFakerMethod(
  callable: (...args: readonly unknown[]) => unknown,
  fakerMethod: string,
  args: FakerArg[],
  logger: Logger
) {
  // If args are present and safe, try calling with args
  if (args.length > 0 && areFakerArgsValid(args)) {
    try {
      const usableArgs = prepareFakerArgs(args);
      callable(...usableArgs);
      return { isValid: true, fakerArgs: args };
    } catch {
      // Call with args failed. Fall through to trying without args
    }
  }

  // Try without args (either because args were invalid or args failed)
  try {
    callable();
    return { isValid: true, fakerArgs: [] };
  } catch (error) {
    // Calling the method without arguments failed.
    logger.log.warn(
      mongoLogId(1_001_000_377),
      'Collection',
      'Invalid faker method',
      { error, fakerMethod, fakerArgs: args }
    );
    return { isValid: false, fakerArgs: [] };
  }
}

/**
 * Prepares the faker args to ensure we can call the method with the args.
 * Objects with a 'json' property are parsed into a JSON object.
 * @example
 * [
 *   { json: '{"a": 1}' },
 *   { json: '{"b": 2}' },
 * ]
 * becomes
 * [ { a: 1 }, { b: 2 } ]
 */
function prepareFakerArgs(args: FakerArg[]) {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null && 'json' in arg) {
      return JSON.parse(arg.json);
    }
    return arg;
  });
}
