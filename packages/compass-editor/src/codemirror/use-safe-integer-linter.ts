import { useCallback, useMemo, useState } from 'react';
import { useCurrentValueRef } from '@mongodb-js/compass-components';
import type { syntaxTree } from '@codemirror/language';
import type { Text } from '@codemirror/state';
import type { EditorRef } from '../types';
import type { Annotation } from './../editor';
import { createCodemirrorLinter } from '../linter';
import type { LintConfig } from '../linter';
import { wrapLinterAnnotation } from '../lint-tooltip-exit-delay';

type SyntaxNode = ReturnType<typeof syntaxTree>['topNode'];

export type SafeIntegerViolation = {
  from: number;
  to: number;
  // True when the literal is an argument to a constructor that takes the same
  // value as a string, like `Long(123...)`. The fix then quotes the argument
  // in place instead of wrapping the whole thing again.
  acceptsStringArgument: boolean;
};

type SafeIntegerLinterOptions = LintConfig & {
  editorRef?: React.RefObject<EditorRef>;
  onFixViolation?: (source: string) => string;
  onViolationFixed: () => void;
  externalAnnotations?: React.RefObject<Annotation[]>;
};

type FixOptions = {
  onFixViolation: (source: string) => string;
  onViolationFixed: () => void;
};

const defaultOnFixViolation = (source: string) => `Long("${source}")`;

const VIOLATION_MESSAGE = 'Exceeds safe integer range.';

// Constructors that accept a string and use the value. Anything else
// either changes meaning (`Date`) or still rounds the value (`Int32`,
// `Double`), so those get wrapped instead.
const STRING_ARGUMENT_CONSTRUCTORS = new Set([
  'Long',
  'NumberLong',
  'Int64',
  'Decimal128',
  'NumberDecimal',
]);

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

// A leading `-` is a unary expression around the literal rather than part of
// it, so it has to be pulled into the violation to fix `-123...` as
// `Long("-123...")` rather than `-Long("123...")`.
function negationOperator(node: SyntaxNode, doc: Text): SyntaxNode | null {
  const operator =
    node.parent?.name === 'UnaryExpression' ? node.parent.firstChild : null;
  return operator?.name === 'ArithOp' &&
    doc.sliceString(operator.from, operator.to) === '-'
    ? operator
    : null;
}

function isStringConstructorArgument(node: SyntaxNode, doc: Text): boolean {
  if (node.parent?.name !== 'ArgList') {
    return false;
  }
  const callee = node.parent.prevSibling;
  return (
    callee?.name === 'VariableName' &&
    STRING_ARGUMENT_CONSTRUCTORS.has(doc.sliceString(callee.from, callee.to))
  );
}

function unsafeIntegerViolation(
  node: SyntaxNode,
  doc: Text
): SafeIntegerViolation | null {
  if (!isUnsafeInteger(doc.sliceString(node.from, node.to))) {
    return null;
  }
  const literal = negationOperator(node, doc)?.parent ?? node;
  return {
    from: literal.from,
    to: literal.to,
    acceptsStringArgument: isStringConstructorArgument(literal, doc),
  };
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
        v.acceptsStringArgument === b[i].acceptsStringArgument
    )
  );
}

function applyFix(
  violation: SafeIntegerViolation,
  source: string,
  { onFixViolation, onViolationFixed }: FixOptions
): string {
  // The violation can span whitespace between a sign and its digits (`- 123`).
  const literal = source.replace(/\s+/g, '');
  onViolationFixed();
  return violation.acceptsStringArgument
    ? `"${literal}"`
    : onFixViolation(literal);
}

export function useSafeIntegerLinter({
  editorRef,
  onFixViolation = defaultOnFixViolation,
  onViolationFixed,
  externalAnnotations,
  lintDelay,
  tooltipExitDelay,
  theme,
}: SafeIntegerLinterOptions) {
  const [violations, setViolations] = useState<SafeIntegerViolation[]>([]);
  const optionsRef = useCurrentValueRef({
    onFixViolation,
    onViolationFixed,
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
            const violation = unsafeIntegerViolation(node.node, view.state.doc);
            if (violation) {
              violations.push(violation);
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
                      insert: applyFix(
                        violation,
                        view.state.sliceDoc(from, to),
                        optionsRef.current
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
          insert: applyFix(
            violation,
            editor.state.sliceDoc(from, to),
            optionsRef.current
          ),
        };
      }),
    });
    setViolations([]);
  }, [violations, editorRef]);

  return { safeIntegerLinter, violations, onFixViolations };
}
