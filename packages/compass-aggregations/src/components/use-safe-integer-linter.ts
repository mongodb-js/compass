import { createSafeIntegerLinter } from '@mongodb-js/compass-editor';
import type { Annotation } from '@mongodb-js/compass-editor';
import { useMemo } from 'react';

export type SafeIntegerLinter = ReturnType<typeof createSafeIntegerLinter>;

export function useSafeIntegerLinter(
  externalViolations: React.RefObject<Annotation[]>
) {
  const safeIntegerLinter = useMemo(() => {
    return createSafeIntegerLinter({
      delay: 300,
      onViolations(_violations): Annotation[] {
        const violations: Annotation[] = _violations.map(({ loc, source }) => ({
          from: loc.from,
          to: loc.to,
          severity: 'error' as const,
          message: 'Exceeds safe integer range. Convert to Long to match.',
          actions: [
            {
              name: 'Convert to Long',
              apply: (view, from, to) => {
                view.dispatch({
                  changes: [
                    {
                      from,
                      to,
                      insert: `Long("${source}")`,
                    },
                  ],
                });
              },
            },
          ],
        }));
        return [...violations, ...(externalViolations.current ?? [])];
      },
    });
  }, []);
  return { safeIntegerLinter };
}
