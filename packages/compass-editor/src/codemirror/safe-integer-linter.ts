import type { Annotation } from '../editor';
import type { Extension } from '@codemirror/state';
import type { LintConfig } from '../linter';
import { createCodemirrorLinter } from '../linter';

type CreateSafeIntegerLinterOptions = LintConfig & {
  onViolation: (from: number, to: number, source: string) => Annotation;
};

export function createSafeIntegerLinter({
  onViolation,
  ...linterOptions
}: CreateSafeIntegerLinterOptions): Extension {
  return createCodemirrorLinter((tree, view) => {
    const violations: Annotation[] = [];
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
            violations.push(onViolation(from, to, str));
          }
        } catch {
          return;
        }
      },
    });
    return violations;
  }, linterOptions);
}
