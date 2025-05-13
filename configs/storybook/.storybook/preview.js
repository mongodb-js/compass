import {
  LeafyGreenProvider,
  palette,
  css,
  cx,
  spacing,
} from '@mongodb-js/compass-components';
import { pad } from 'lodash';

const homeContainerStyles = css({
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  // ensure modals and any other overlays will
  // paint properly above the content
  position: 'relative',
  padding: spacing[3],
  zIndex: 0,
});

const globalLightThemeStyles = css({
  backgroundColor: palette.white,
  color: palette.gray.dark2,
});

const globalDarkThemeStyles = css({
  backgroundColor: palette.black,
  color: palette.white,
});

const reset = css`
  /* Remove list styles (bullets/numbers) */
  ol,
  ul {
    list-style: none;
  }

  /* Preferred box-sizing value */
  *,
  *::after,
  *::before {
    box-sizing: border-box;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    font-smoothing: antialiased;
  }

  input,
  button,
  select,
  textarea {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }
  button,
  input,
  optgroup,
  select,
  textarea {
    color: inherit;
    font: inherit;
    margin: 0;
  }

  html,
  body,
  fieldset,
  ul,
  ol,
  dd,
  dt {
    margin: 0;
    padding: 0;
    border: 0;
  }

  blockquote,
  q {
    quotes: none;
  }
  blockquote:before,
  blockquote:after,
  q:before,
  q:after {
    content: '';
    content: none;
  }

  /* Remove spacing between cells in tables */
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }
`;

export const globalTypes = {
  theme: {
    description: 'Global theme for components',
    toolbar: {
      // The label to show for this toolbar item
      title: 'Theme',
      icon: 'circlehollow',
      // Array of plain string values or MenuItem shape (see below)
      items: ['light', 'dark'],
      // Change title based on selected value
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = {
  theme: 'light',
};

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  layout: 'fullscreen',
};

export const decorators = [
  (Story, context) => {
    const isDarkMode = context.globals.theme === 'dark';
    return (
      <LeafyGreenProvider darkMode={isDarkMode}>
        <div className={reset}>
          <div
            className={cx(
              homeContainerStyles,
              isDarkMode ? globalDarkThemeStyles : globalLightThemeStyles
            )}
          >
            <Story />
          </div>
        </div>
      </LeafyGreenProvider>
    );
  },
];
