import { css } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { createUniqueClassName } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

export const richLinkTextClassName = createUniqueClassName('lg-chat-rich-link');

export const baseStyles = css`
  box-shadow: none;
  padding: ${spacing[200]}px;
  border-radius: ${spacing[200]}px;
  text-decoration: none;
  min-height: ${spacing[900]}px;
  min-width: 100px;

  & .${richLinkTextClassName} {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const themeStyles = {
  [Theme.Dark]: css`
    background-color: ${palette.gray.dark4};

    &:hover {
      box-shadow: 0 0 0 3px ${palette.gray.dark2};
    }
  `,
  [Theme.Light]: css`
    background-color: ${palette.gray.light3};

    &:hover {
      box-shadow: 0 0 0 3px ${palette.gray.light2};
    }
  `,
};

export const badgeAreaStyles = css`
  // Extra padding to make room for the absolutely positioned badge
  // We have to account for the badge as well as "fake padding" from the "bottom" and "left" attributes.
  // 1. "fake padding" below the badge (spacing[200])
  // 2. badge height (18)
  // 3. "fake padding" on top of the badge (spacing[200])
  padding-bottom: calc(${spacing[200]}px + 18px + ${spacing[200]}px);
`;

export const imageBackgroundStyles = (imageUrl: string) => css`
  background: linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)),
    url(${imageUrl});
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  border-radius: ${spacing[200]}px;
  min-height: ${spacing[900]}px;

  & .${richLinkTextClassName} {
    color: ${palette.white};
  }
`;
