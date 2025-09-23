import type { FakerArg } from './script-generation-utils';
import { faker } from '@faker-js/faker/locale/en';

const MAX_FAKER_ARGS_LENGTH = 10;
const MAX_FAKER_STRING_LENGTH = 1000;

/**
 * Checks if the provided faker arguments are valid.
 * - Numbers must be finite
 * - Strings must not exceed max length
 * - Arrays must not exceed max length and all elements must be valid
 * - Objects must have a 'json' property that is a valid JSON string and all values must be valid
 */
export function areFakerArgsValid(fakerArgs: FakerArg[]): boolean {
  if (fakerArgs.length === 0) {
    return true;
  }
  if (fakerArgs.length > MAX_FAKER_ARGS_LENGTH) {
    return false;
  }
  for (const arg of fakerArgs) {
    if (arg === null || arg === undefined) {
      return false;
    }
    if (typeof arg === 'number') {
      if (!Number.isFinite(arg)) {
        return false;
      }
    } else if (typeof arg === 'string') {
      if (arg.length > MAX_FAKER_STRING_LENGTH) {
        return false;
      }
    } else if (typeof arg === 'boolean') {
      // booleans are always valid, continue
    } else if (Array.isArray(arg)) {
      if (!areFakerArgsValid(arg)) {
        return false;
      }
    } else if (typeof arg === 'object' && typeof arg.json === 'string') {
      try {
        const parsedJson = JSON.parse(arg.json);
        if (!areFakerArgsValid(Object.values(parsedJson))) {
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
  fakerArgs: FakerArg[]
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
    isAllowedHelper(moduleName, methodName) &&
    canInvokeFakerMethod(fakerModule, methodName)
  ) {
    const callableFakerMethod = (fakerModule as Record<string, any>)[
      methodName
    ];
    return tryInvokeFakerMethod(callableFakerMethod, fakerArgs);
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

function isAllowedHelper(moduleName: string, methodName: string) {
  return moduleName !== 'helpers' || methodName === 'arrayElement';
}

function canInvokeFakerMethod(fakerModule: any, methodName: string) {
  return (
    fakerModule !== null &&
    fakerModule !== undefined &&
    typeof fakerModule === 'object' &&
    typeof fakerModule[methodName] === 'function'
  );
}

function tryInvokeFakerMethod(
  callable: (...args: any[]) => any,
  args: FakerArg[]
) {
  try {
    if (areFakerArgsValid(args)) {
      callable(...args);
      return { isValid: true, fakerArgs: args };
    }
  } catch {
    // Intentionally ignored: error may be due to invalid arguments, will retry without args.
    if (args.length > 0) {
      try {
        callable();
        return { isValid: true, fakerArgs: [] };
      } catch {
        // Intentionally ignored: method is invalid without arguments as well.
        return { isValid: false, fakerArgs: [] };
      }
    }
  }
  return { isValid: false, fakerArgs: [] };
}
