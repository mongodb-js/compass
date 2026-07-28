import { linter } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import type { Annotation, EditorView } from './editor';
import type { Extension } from '@codemirror/state';

export type LintConfig = Parameters<typeof linter>[1];

export function createCodemirrorLinter(
  // Function that produces diagnostics
  diagnosticsFn: (
    tree: ReturnType<typeof syntaxTree>,
    view: EditorView
  ) => Annotation[],
  config?: LintConfig
): Extension {
  return linter((view) => diagnosticsFn(syntaxTree(view.state), view), config);
}
