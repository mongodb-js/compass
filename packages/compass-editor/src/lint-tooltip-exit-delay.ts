import { ViewPlugin, showTooltip, type EditorView } from '@codemirror/view';
import {
  Annotation as StateAnnotation,
  EditorState,
  type Extension,
  type StateEffect,
  type TransactionSpec,
} from '@codemirror/state';
import type { Annotation } from './editor';

const delayedHide = StateAnnotation.define<boolean>();
const DEFAULT_TOOLTIP_EXIT_DELAY = 300;
export const TOOLTIP_DATA_ATTR = 'data-codemirror-linter';

export function wrapLinterAnnotation(annotation: Annotation): Annotation {
  return {
    ...annotation,
    renderMessage: (view: EditorView): Node => {
      const wrapper = document.createElement('span');
      wrapper.setAttribute(TOOLTIP_DATA_ATTR, 'true');
      if (annotation.renderMessage) {
        wrapper.appendChild(annotation.renderMessage(view));
      } else {
        wrapper.textContent = annotation.message;
      }
      return wrapper;
    },
  };
}

export const TOOLTIP_SELECTOR = `.cm-diagnostic:has([${TOOLTIP_DATA_ATTR}=true])`;
const HOVER_SELECTOR = `${TOOLTIP_SELECTOR}, .cm-lint-marker`;

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
    if (target?.closest?.(HOVER_SELECTOR)) {
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
        const stillShown = new Set(tr.state.facet(showTooltip).filter(Boolean));
        const hidesTooltip = before.some(
          (tooltip) => tooltip && !stillShown.has(tooltip)
        );
        if (!hidesTooltip || !document.querySelector(TOOLTIP_SELECTOR)) {
          return tr;
        }
        hideEffects = tr.effects;
        scheduleHide();
        return [];
      }
    ),
  ];
}
