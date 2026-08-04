import { linter } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import type { Annotation } from './editor';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

// Do not show inline (on-hover) tooltips for linting errors,
// we will show them in the gutter instead
const noInlineTooltips = () => [];

export type LintConfig = {
  delay?: number;
  // Optional theme spec used to style the diagnostic popover. When provided
  // we build an `EditorView.theme` from it and return an array of extensions
  // instead of a single linter extension.
  theme?: {
    spec: Parameters<typeof EditorView.theme>[0];
    options?: Parameters<typeof EditorView.theme>[1];
  };
};

export function createCodemirrorLinter(
  diagnosticsFn: (
    tree: ReturnType<typeof syntaxTree>,
    view: EditorView
  ) => Annotation[],
  config?: LintConfig
): Extension {
  const lintExtension = linter(
    (view) => diagnosticsFn(syntaxTree(view.state), view),
    {
      delay: config?.delay ?? 500,
      tooltipFilter: noInlineTooltips,
    }
  );
  if (config?.theme) {
    const themeExtension = EditorView.theme(
      config.theme.spec,
      config.theme.options
    );
    return [lintExtension, themeExtension];
  }
  return lintExtension;
}
