import type { Annotation } from '../editor';
import type { Extension } from '@codemirror/state';
import type { LintConfig } from '../linter';
import { createCodemirrorLinter } from '../linter';

export type SafeIntegerViolation = {
  loc: {
    from: number;
    to: number;
  };
  source: string;
};

type CreateSafeIntegerLinterOptions = LintConfig & {
  onViolations: (violation: SafeIntegerViolation[]) => Annotation[];
};

export function createSafeIntegerLinter({
  onViolations,
  ...linterOptions
}: CreateSafeIntegerLinterOptions): Extension {
  return createCodemirrorLinter((tree, view) => {
    const violations: SafeIntegerViolation[] = [];
    tree.iterate({
      enter: (node) => {
        // Only warn on bare number literals. Not Int64(...)
        if (node.name !== 'Number' || node.node.parent?.name === 'ArgList') {
          return;
        }
        const from = node.from;
        const to = node.to;
        const str = view.state.sliceDoc(from, to);
        if (!/^-?\d+$/.test(str)) {
          return;
        }

        try {
          const num = BigInt(str);
          const isInvalid =
            num > BigInt(Number.MAX_SAFE_INTEGER) ||
            num < BigInt(Number.MIN_SAFE_INTEGER);
          if (isInvalid) {
            violations.push({
              loc: { from, to },
              source: str,
            });
          }
        } catch {
          return;
        }
      },
    });
    return onViolations(violations);
  }, linterOptions);
}
