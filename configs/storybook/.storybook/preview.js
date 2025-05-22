import {
  LeafyGreenProvider,
  palette,
  css,
  cx,
  spacing,
  fontFamilies,
} from '@mongodb-js/compass-components';

import './global.css';

const fontStyles = css`
  @font-face {
    font-family: 'Euclid Circular A';
    font-weight: 700;
    font-style: normal;
    src: url('../../../packages/compass/src/app/fonts/EuclidCircularA-Semibold-WebXL.woff2')
        format('woff2'),
      url('../../../packages/compass/src/app/fonts/EuclidCircularA-Semibold-WebXL.woff')
        format('woff');
  }

  @font-face {
    font-family: 'Euclid Circular A';
    font-weight: 700;
    font-style: italic;
    src: url('../../../packages/compass/src/app/fonts/EuclidCircularA-SemiboldItalic-WebXL.woff2')
        format('woff2'),
      url('../../../packages/compass/src/app/fonts/EuclidCircularA-SemiboldItalic-WebXL.woff')
        format('woff');
  }

  @font-face {
    font-family: 'Euclid Circular A';
    font-weight: 500;
    font-style: normal;
    src: url('../../../packages/compass/src/app/fonts/EuclidCircularA-Medium-WebXL.woff2')
        format('woff2'),
      url('../../../packages/compass/src/app/fonts/EuclidCircularA-Medium-WebXL.woff')
        format('woff');
  }

  @font-face {
    font-family: 'Euclid Circular A';
    font-weight: 500;
    font-style: italic;
    src: url('../../../packages/compass/src/app/fonts/EuclidCircularA-MediumItalic-WebXL.woff2')
        format('woff2'),
      url('../../../packages/compass/src/app/fonts/EuclidCircularA-MediumItalic-WebXL.woff')
        format('woff');
  }

  @font-face {
    font-family: 'Euclid Circular A';
    font-weight: 400;
    font-style: normal;
    src: url('../../../packages/compass/src/app/fonts/EuclidCircularA-Regular-WebXL.woff2')
        format('woff2'),
      url('../../../packages/compass/src/app/fonts/EuclidCircularA-Regular-WebXL.woff')
        format('woff');
  }

  @font-face {
    font-family: 'Euclid Circular A';
    font-weight: 400;
    font-style: italic;
    src: url('../../../packages/compass/src/app/fonts/EuclidCircularA-RegularItalic-WebXL.woff2')
        format('woff2'),
      url('../../../packages/compass/src/app/fonts/EuclidCircularA-RegularItalic-WebXL.woff')
        format('woff');
  }
`;

const homeContainerStyles = css({
  padding: spacing[3],
  fontFamily:
    "'Euclid Circular A', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: 13,
  fontFamilies: fontFamilies.default,
});

const globalLightThemeStyles = css({
  backgroundColor: palette.white,
  color: palette.gray.dark2,
});

const globalDarkThemeStyles = css({
  backgroundColor: palette.black,
  color: palette.white,
});

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
        <div className={fontStyles}>
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
