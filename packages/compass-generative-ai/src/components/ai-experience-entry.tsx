import React, { useCallback } from 'react';
import {
  css,
  cx,
  focusRing,
  palette,
  spacing,
  useDarkMode,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import {
  type TrackFunction,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';

import {
  AIEntrySVG,
  getAIEntrySVGString,
  aiEntrySVGDarkModeStyles,
  aiEntrySVGLightModeStyles,
  aiEntrySVGStyles,
} from './ai-entry-svg';

const hiddenOnNarrowStyles = css({
  [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < 900px)`]:
    {
      display: 'none',
    },
});

const aiEntryStyles = css(
  {
    // Reset button styles.
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    // A bit of a hack to make the focus ring look nice without
    // moving the component around.
    padding: `${spacing[100]}px ${spacing[200]}px`,
    margin: `${-spacing[100]}px ${-spacing[200]}px`,
    background: 'none',
    whiteSpace: 'normal',
    position: 'relative',

    // Text styles.
    textDecoration: 'underline',
    fontWeight: 'bold',

    // Aligning elements.
    display: 'inline-flex',
    gap: `${spacing[100]}px`,

    transition: 'color 0.16s ease-in',
    path: {
      transition: 'fill 0.16s ease-in',
    },

    '&:hover': {
      cursor: 'pointer',
    },
  },
  focusRing,
  aiEntrySVGStyles
);

const aiEntryDarkModeStyles = css(
  {
    color: palette.green.dark1,
    '&:hover': {
      path: {
        fill: palette.green.base,
      },
      color: palette.green.base,
    },
  },
  aiEntrySVGDarkModeStyles
);

const aiEntryLightModeStyles = css(
  {
    color: palette.green.dark2,
    '&:hover': {
      path: {
        fill: palette.green.dark1,
      },
      color: palette.green.dark1,
    },
  },
  aiEntrySVGLightModeStyles
);

function AIExperienceEntry({
  'data-testid': dataTestId = 'open-gen-ai-button',
  type,
  onClick,
}: {
  ['data-testid']?: string;
  type: 'aggregation' | 'query';
  onClick: () => void;
}) {
  const darkMode = useDarkMode();
  const track = useTelemetry();

  const handleClick = useCallback(() => {
    track('AI Generate Query Clicked', { type });
    onClick();
  }, [track, onClick, type]);

  return (
    <button
      className={cx(
        aiEntryStyles,
        darkMode ? aiEntryDarkModeStyles : aiEntryLightModeStyles
      )}
      onClick={handleClick}
      data-testid={dataTestId}
      type="button"
      title={`Generate ${type}`}
    >
      <span className={hiddenOnNarrowStyles}>Generate {type}</span>
      <AIEntrySVG darkMode={darkMode} />
    </button>
  );
}

// We build the AI Placeholder with html elements as our
// codemirror placeholder extension accepts `HTMLElement`s.
function createAIPlaceholderHTMLPlaceholder({
  onClickAI,
  darkMode,
  placeholderText,
  track,
}: {
  onClickAI: () => void;
  darkMode?: boolean;
  placeholderText: string;
  track: TrackFunction;
}): () => HTMLElement {
  const containerEl = document.createElement('div');

  const placeholderTextEl = document.createTextNode(`${placeholderText} or `);
  containerEl.appendChild(placeholderTextEl);

  const aiButtonEl = document.createElement('button');
  aiButtonEl.setAttribute('data-testid', 'open-ai-query-entry-button');
  aiButtonEl.setAttribute('type', 'button');
  // By default placeholder container will have pointer events disabled
  aiButtonEl.style.pointerEvents = 'auto';
  // We stop mousedown from propagating and preventing default behavior to avoid
  // input getting focused on placeholder click (that's the event that
  // codemirror uses internally to set focus to the input)
  aiButtonEl.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  aiButtonEl.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    track('AI Generate Query Clicked' as const, { type: 'query' });
    onClickAI();
  });

  aiButtonEl.className = cx(
    aiEntryStyles,
    darkMode ? aiEntryDarkModeStyles : aiEntryLightModeStyles
  );

  const aiButtonContent = `<span>Generate query</span>
${getAIEntrySVGString()}`;
  aiButtonEl.innerHTML = aiButtonContent;

  containerEl.appendChild(aiButtonEl);

  // Return a function to prevent codemirror from cloning the DOM node (this
  // doesn't transfer event listeners)
  return () => containerEl;
}

export { AIExperienceEntry, createAIPlaceholderHTMLPlaceholder };
