import { useCallback, useMemo, useState } from 'react';
import { useCurrentValueRef } from '@mongodb-js/compass-components';
import type { EditorRef } from '../types';
import type { Annotation } from './../editor';
import { createCodemirrorLinter } from '../linter';
import type { LintConfig } from '../linter';
import { wrapLinterAnnotation } from '../lint-tooltip-exit-delay';

export type SafeIntegerViolation = {
  from: number;
  to: number;
  // True when the literal is already an argument to a constructor call like
  // `Long(123...)`. The fix then quotes the argument (`Long("123...")`)
  // instead of wrapping the whole thing again.
  // TODO(COMPASS-10964): update this argument check to only include
  // methods we know handle string arguments.
  isArgument: boolean;
};

type SafeIntegerLinterOptions = LintConfig & {
  editorRef?: React.RefObject<EditorRef>;
  onFixViolation?: (source: string) => string;
  externalAnnotations?: React.RefObject<Annotation[]>;
};

const defaultOnFixViolation = (source: string) => `Long("${source}")`;

const VIOLATION_MESSAGE = 'Exceeds safe integer range.';

function isUnsafeInteger(str: string): boolean {
  if (!/^-?\d+$/.test(str)) {
    return false;
  }
  try {
    const num = BigInt(str);
    return (
      num > BigInt(Number.MAX_SAFE_INTEGER) ||
      num < BigInt(Number.MIN_SAFE_INTEGER)
    );
  } catch {
    return false;
  }
}

function sameViolations(
  a: SafeIntegerViolation[],
  b: SafeIntegerViolation[]
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (v, i) =>
        v.from === b[i].from &&
        v.to === b[i].to &&
        v.isArgument === b[i].isArgument
    )
  );
}

function fixFor(
  violation: SafeIntegerViolation,
  source: string,
  onFixViolation: (source: string) => string
): string {
  return violation.isArgument ? `"${source}"` : onFixViolation(source);
}

export function useSafeIntegerLinter({
  editorRef,
  onFixViolation = defaultOnFixViolation,
  externalAnnotations,
  lintDelay,
  tooltipExitDelay,
  theme,
}: SafeIntegerLinterOptions = {}) {
  const [violations, setViolations] = useState<SafeIntegerViolation[]>([]);
  const optionsRef = useCurrentValueRef({
    onFixViolation,
    externalAnnotations,
  });
  const violationsRef = useCurrentValueRef(violations);

  const safeIntegerLinter = useMemo(() => {
    return createCodemirrorLinter(
      (tree, view) => {
        const violations: SafeIntegerViolation[] = [];
        tree.iterate({
          enter: (node) => {
            // Warn on any bare number literal, including one passed as a
            // numeric argument to a constructor like `Long(123...)`: the
            // literal is parsed as a JS double and loses precision before the
            // constructor sees it.
            if (node.name !== 'Number') {
              return;
            }
            if (isUnsafeInteger(view.state.sliceDoc(node.from, node.to))) {
              violations.push({
                from: node.from,
                to: node.to,
                isArgument: node.node.parent?.name === 'ArgList',
              });
            }
          },
        });

        // Only update state when the violations actually changed, otherwise
        // every lint pass re-renders the consumer with a new array identity.
        if (!sameViolations(violationsRef.current, violations)) {
          violationsRef.current = violations;
          setViolations(violations);
        }

        const annotations = violations.map((violation): Annotation => {
          const { from, to } = violation;
          return {
            from,
            to,
            severity: 'error',
            message: VIOLATION_MESSAGE,
            actions: [
              {
                name: 'Convert to Long',
                apply: (view, from, to) => {
                  view.dispatch({
                    changes: {
                      from,
                      to,
                      insert: fixFor(
                        violation,
                        view.state.sliceDoc(from, to),
                        optionsRef.current.onFixViolation
                      ),
                    },
                  });
                },
              },
            ],
          };
        });

        return [
          ...annotations.map(wrapLinterAnnotation),
          ...(optionsRef.current.externalAnnotations?.current ?? []),
        ];
      },
      { lintDelay, theme, tooltipExitDelay }
    );
  }, [lintDelay, theme, tooltipExitDelay]);

  const onFixViolations = useCallback(() => {
    const editor = editorRef?.current?.editor;
    if (!editor || violations.length === 0) {
      return;
    }
    editor.dispatch({
      changes: violations.map((violation) => {
        const { from, to } = violation;
        return {
          from,
          to,
          insert: fixFor(
            violation,
            editor.state.sliceDoc(from, to),
            optionsRef.current.onFixViolation
          ),
        };
      }),
    });
    setViolations([]);
  }, [violations, editorRef]);

  return { safeIntegerLinter, violations, onFixViolations };
}
