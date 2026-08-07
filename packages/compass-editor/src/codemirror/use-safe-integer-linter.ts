import { useCallback, useMemo, useState } from 'react';
import { useCurrentValueRef } from '@mongodb-js/compass-components';
import type { EditorRef } from '../types';
import type { Annotation } from './../editor';
import { createCodemirrorLinter } from '../linter';

export type SafeIntegerViolation = {
  from: number;
  to: number;
};

type SafeIntegerLinterOptions = {
  editorRef?: React.RefObject<EditorRef>;
  onFixViolation?: (source: string) => string;
  lintDelay?: number;
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
    a.every((v, i) => v.from === b[i].from && v.to === b[i].to)
  );
}

export function useSafeIntegerLinter({
  editorRef,
  onFixViolation = defaultOnFixViolation,
  lintDelay = 500,
  externalAnnotations,
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
            // Only warn on bare number literals, not on Int64(...) arguments
            if (
              node.name !== 'Number' ||
              node.node.parent?.name === 'ArgList'
            ) {
              return;
            }
            if (isUnsafeInteger(view.state.sliceDoc(node.from, node.to))) {
              violations.push({ from: node.from, to: node.to });
            }
          },
        });

        // Only update state when the violations actually changed, otherwise
        // every lint pass re-renders the consumer with a new array identity.
        if (!sameViolations(violationsRef.current, violations)) {
          violationsRef.current = violations;
          setViolations(violations);
        }

        const annotations = violations.map(({ from, to }): Annotation => {
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
                      insert: optionsRef.current.onFixViolation(
                        view.state.sliceDoc(from, to)
                      ),
                    },
                  });
                },
              },
            ],
          };
        });

        return [
          ...annotations,
          ...(optionsRef.current.externalAnnotations?.current ?? []),
        ];
      },
      { delay: lintDelay }
    );
  }, [lintDelay]);

  const onFixViolations = useCallback(() => {
    const editor = editorRef?.current?.editor;
    if (!editor || violations.length === 0) {
      return;
    }
    editor.dispatch({
      changes: violations.map(({ from, to }) => ({
        from,
        to,
        insert: optionsRef.current.onFixViolation(
          editor.state.sliceDoc(from, to)
        ),
      })),
    });
    setViolations([]);
  }, [violations, editorRef]);

  return { safeIntegerLinter, violations, onFixViolations };
}
