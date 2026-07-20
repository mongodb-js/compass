type UnsafeIntegerViolation = {
  source: string;
  loc: { from: number; to: number };
};

const SINGULAR_UNSAFE_INTEGER_ERROR_MESSAGE =
  'Number exceeds the safe integer range. Wrap it as {"$numberLong": "..."} to preserve its exact value.';
const PLURAL_UNSAFE_INTEGER_ERROR_MESSAGE =
  'Numbers exceed the safe integer range. Wrap them as {"$numberLong": "..."} to preserve their exact value.';

export class UnsafeIntegerValidationError extends Error {
  violations: UnsafeIntegerViolation[] = [];
  constructor(violations: UnsafeIntegerViolation[]) {
    const message =
      violations.length === 1
        ? SINGULAR_UNSAFE_INTEGER_ERROR_MESSAGE
        : PLURAL_UNSAFE_INTEGER_ERROR_MESSAGE;
    super(message);
    this.name = 'UnsafeIntegerValidationError';
    this.violations = violations;
  }
}

export function assertNoUnsafeIntegers(input: string): void {
  const violations: UnsafeIntegerViolation[] = [];
  let cursor = 0;
  JSON.parse(
    input,
    function (_key: string, value: unknown, context?: { source?: string }) {
      const source = context?.source;
      if (source === undefined) {
        return value;
      }
      const from = input.indexOf(source, cursor);
      const to = from + source.length;
      cursor = to;
      if (
        typeof value === 'number' &&
        !Number.isSafeInteger(value) &&
        // Check if the source is an integer literal
        /^-?\d+$/.test(source)
      ) {
        violations.push({
          source,
          loc: { from, to },
        });
      }
      return value;
    }
  );
  if (violations.length > 0) {
    throw new UnsafeIntegerValidationError(violations);
  }
}
