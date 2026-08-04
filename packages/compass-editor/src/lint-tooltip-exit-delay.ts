import { ViewPlugin, showTooltip, type EditorView } from '@codemirror/view';
import {
  Annotation,
  EditorState,
  type Extension,
  type StateEffect,
  type TransactionSpec,
} from '@codemirror/state';

const delayedHide = Annotation.define<boolean>();
const DEFAULT_TOOLTIP_EXIT_DELAY = 300;
const LINT_HOVER_SELECTOR = '.cm-tooltip-lint, .cm-lint-marker';

export function lintTooltipExitDelay(
  tooltipExitDelay: number = DEFAULT_TOOLTIP_EXIT_DELAY
): Extension {
  let editorView: EditorView | undefined;
  let pendingTimeout: ReturnType<typeof setTimeout> | undefined;
  let hideEffects: readonly StateEffect<unknown>[] | undefined;

  const clearPendingTimeout = () => {
    clearTimeout(pendingTimeout);
    pendingTimeout = undefined;
  };

  const hideTooltip = () => {
    pendingTimeout = undefined;
    const effects = hideEffects;
    hideEffects = undefined;
    if (effects) {
      editorView?.dispatch({ effects, annotations: delayedHide.of(true) });
    }
  };

  const scheduleHide = () => {
    clearPendingTimeout();
    pendingTimeout = setTimeout(hideTooltip, tooltipExitDelay);
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!hideEffects) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest?.(LINT_HOVER_SELECTOR)) {
      // Pointer came back in time, keep the tooltip open until it leaves again.
      clearPendingTimeout();
    } else if (!pendingTimeout) {
      scheduleHide();
    }
  };

  return [
    ViewPlugin.define((view) => {
      editorView = view;
      // Listening on the window rather than through `domEventHandlers`: neither
      // the gutter marker nor the tooltip is part of the editor content DOM.
      window.addEventListener('mousemove', onMouseMove);
      return {
        destroy() {
          window.removeEventListener('mousemove', onMouseMove);
          clearPendingTimeout();
          hideEffects = undefined;
          editorView = undefined;
        },
      };
    }),

    EditorState.transactionFilter.of(
      (tr): TransactionSpec | readonly TransactionSpec[] => {
        if (tr.annotation(delayedHide) || tr.docChanged || !tr.effects.length) {
          return tr;
        }
        const before = tr.startState.facet(showTooltip);
        const after = tr.state.facet(showTooltip);
        const hidesTooltip = before.some(
          (tooltip, index) => tooltip && !after[index]
        );
        if (!hidesTooltip || !document.querySelector('.cm-tooltip-lint')) {
          return tr;
        }
        hideEffects = tr.effects;
        scheduleHide();
        return [];
      }
    ),
  ];
}
