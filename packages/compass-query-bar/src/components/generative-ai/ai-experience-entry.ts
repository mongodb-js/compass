import {
  css,
  cx,
  focusRing,
  spacing,
  palette,
} from '@mongodb-js/compass-components';

import { OPTION_DEFINITION } from '../../constants/query-option-definition';
import {
  getRobotSVGString,
  robotSVGDarkModeStyles,
  robotSVGLightModeStyles,
  robotSVGStyles,
} from './robot-svg';

const aiQueryEntryStyles = css(
  {
    // Reset button styles.
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    // A bit of a hack to make the focus ring look nice without
    // moving the component around.
    padding: `${spacing[1]}px ${spacing[2]}px`,
    margin: `${-spacing[1]}px ${-spacing[2]}px`,
    background: 'none',
    whiteSpace: 'normal',
    position: 'relative',

    // Text styles.
    textDecoration: 'underline',
    fontWeight: 'bold',

    // Aligning elements.
    display: 'inline-flex',
    gap: `${spacing[1]}px`,

    transition: 'color 0.16s ease-in',
    rect: {
      transition: 'fill 0.16s ease-in',
    },

    '&:hover': {
      cursor: 'pointer',
    },
  },
  focusRing,
  robotSVGStyles
);

const aiQueryEntryDarkModeStyles = css(
  {
    color: palette.green.dark1,
    '&:hover': {
      rect: {
        fill: palette.green.base,
      },
      color: palette.green.base,
    },
  },
  robotSVGDarkModeStyles
);

const aiQueryEntryLightModeStyles = css(
  {
    color: palette.green.dark2,
    '&:hover': {
      rect: {
        fill: palette.green.dark1,
      },
      color: palette.green.dark1,
    },
  },
  robotSVGLightModeStyles
);

// We build the AI Placeholder with html elements as our
// codemirror placeholder extension accepts `HTMLElement`s.
function createAIPlaceholderHTMLPlaceholder({
  onClickAI,
  darkMode,
}: {
  onClickAI: () => void;
  darkMode?: boolean;
}): HTMLElement {
  const containerEl = document.createElement('div');

  const placeholderText = OPTION_DEFINITION.filter.placeholder;
  const placeholderTextEl = document.createTextNode(`${placeholderText} or `);
  containerEl.appendChild(placeholderTextEl);

  const aiButtonEl = document.createElement('button');
  aiButtonEl.setAttribute('data-testid', 'open-ai-query-ask-ai-button');
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
    onClickAI();
  });

  aiButtonEl.className = cx(
    aiQueryEntryStyles,
    darkMode ? aiQueryEntryDarkModeStyles : aiQueryEntryLightModeStyles
  );

  const robotIconSVG = `<span>Ask AI</span>
${getRobotSVGString()}`;
  aiButtonEl.innerHTML = robotIconSVG;

  containerEl.appendChild(aiButtonEl);

  return containerEl;
}

export { createAIPlaceholderHTMLPlaceholder };
