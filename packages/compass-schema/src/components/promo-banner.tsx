import React from 'react';
import {
  css,
  cx,
  Link,
  palette,
  spacing,
  useDarkMode,
  Body,
} from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-SCHEMA-UI');

const iconSize = spacing[5];

const bannerBodyStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[3],
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  borderRadius: '12px',
  marginLeft: spacing[3],
  marginRight: spacing[3],
  '&:not(:last-child)': {
    marginBottom: spacing[4],
  },
});

const bannerBodyLightModeStyles = css({
  backgroundColor: palette.gray.light3,
  boxShadow: `inset 0 0 0 1px ${palette.gray.light2}`,
});

const bannerBodyDarkModeStyles = css({
  backgroundColor: palette.gray.dark3,
  boxShadow: `inset 0 0 0 1px ${palette.gray.dark2}`,
});

const bannerIconStyles = css({
  width: iconSize,
  height: iconSize,
  flex: 'none',
});

const bannerTextStyles = css({
  flex: 'none',
});

const bannerLinkStyles = css({
  flex: 'none',
  marginLeft: 'auto',
});

export const HackoladePromoBanner: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  return (
    <Body
      as="div"
      className={cx(
        bannerBodyStyles,
        bannerBodyLightModeStyles,
        darkMode && bannerBodyDarkModeStyles
      )}
    >
      <svg
        className={bannerIconStyles}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox={`0 0 ${iconSize} ${iconSize}`}
      >
        <rect width="31" height="31" x=".5" y=".5" fill="#fff" rx="15.5" />
        <path fill="#189FCE" d="M19.25 8h-9v9l9-9Z" />
        <path fill="#0073B2" d="M10.25 24v-6.5l5-5h6.5L10.25 24Z" />
        <path fill="#22386F" d="m16.25 18.5 5.5-5.5v11l-5.5-5.5Z" />
        <rect width="31" height="31" x=".5" y=".5" stroke="#C1C7C6" rx="15.5" />
      </svg>
      <Body as="strong" className={bannerTextStyles}>
        Looking for data modeling tools?
      </Body>
      <Link
        className={bannerLinkStyles}
        href="https://hackolade.com/MongoDBcompass.html?utm_source=mongodb&utm_medium=referral&utm_campaign=compass"
        target="_blank"
        onClick={() => {
          track('Hackolade Link Clicked');
        }}
      >
        Check out Hackolade Studio.
      </Link>
    </Body>
  );
};
