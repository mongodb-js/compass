import { linter } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import type { Annotation, EditorView } from './editor';
import type { Extension } from '@codemirror/state';

// Do not show inline (on-hover) tooltips for linting errors,
// we will show them in the gutter instead
const noInlineTooltips = () => [];

export type LintConfig =
  | {
      delay?: number;
    }
  | undefined;

export function createCodemirrorLinter(
  diagnosticsFn: (
    tree: ReturnType<typeof syntaxTree>,
    view: EditorView
  ) => Annotation[],
  config?: LintConfig
): Extension {
  return linter((view) => diagnosticsFn(syntaxTree(view.state), view), {
    delay: config?.delay,
    tooltipFilter: noInlineTooltips,
  });
}
