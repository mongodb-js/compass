import { createSafeIntegerLinter } from '@mongodb-js/compass-editor';
import type {
  Annotation,
  EditorRef,
  SafeIntegerViolation,
} from '@mongodb-js/compass-editor';
import { useCallback, useMemo, useState } from 'react';

const SINGULAR_UNSAFE_INTEGER_ERROR_MESSAGE =
  'Number exceeds the safe integer range. Wrap it as {"$numberLong": "..."} to preserve its exact value.';
const PLURAL_UNSAFE_INTEGER_ERROR_MESSAGE =
  'Numbers exceed the safe integer range. Wrap them as {"$numberLong": "..."} to preserve their exact value.';

export class SafeIntegerValidationError extends Error {
  violations: SafeIntegerViolation[] = [];
  constructor(violations: SafeIntegerViolation[]) {
    const message =
      violations.length === 1
        ? SINGULAR_UNSAFE_INTEGER_ERROR_MESSAGE
        : PLURAL_UNSAFE_INTEGER_ERROR_MESSAGE;
    super(message);
    this.name = 'SafeIntegerValidationError';
    this.violations = violations;
  }
}

export type SafeIntegerLinter = ReturnType<typeof createSafeIntegerLinter>;

export function useSafeIntegerLinter(editorRef: React.RefObject<EditorRef>) {
  const [violationError, setViolationError] =
    useState<SafeIntegerValidationError | null>(null);
  const safeIntegerLinter = useMemo(() => {
    return createSafeIntegerLinter({
      delay: 500,
      onViolations(violations): Annotation[] {
        setViolationError(
          violations.length > 0
            ? new SafeIntegerValidationError(violations)
            : null
        );
        return violations.map(({ loc, source }) => ({
          from: loc.from,
          to: loc.to,
          severity: 'error',
          message:
            'Exceeds safe integer range. Wrap it as {"$numberLong": "..."} to preserve its exact value.',
          actions: [
            {
              name: 'Convert to Long',
              apply: (view, from, to) => {
                view.dispatch({
                  changes: [
                    {
                      from,
                      to,
                      insert: `{"$numberLong": "${source}"}`,
                    },
                  ],
                });
              },
            },
          ],
        }));
      },
    });
  }, []);
  const onFixViolationError = useCallback(() => {
    const editor = editorRef.current?.editor;
    if (!editor) {
      return;
    }
    if (violationError instanceof SafeIntegerValidationError) {
      editor.dispatch({
        changes: violationError.violations.map((violation) => ({
          from: violation.loc.from,
          to: violation.loc.to,
          insert: `{"$numberLong": "${violation.source}"}`,
        })),
      });
      setViolationError(null);
    }
  }, [violationError]);
  return { safeIntegerLinter, violationError, onFixViolationError };
}
