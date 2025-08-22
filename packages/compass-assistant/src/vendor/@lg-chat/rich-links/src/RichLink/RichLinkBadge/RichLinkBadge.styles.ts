import { css } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

import {
  type RichLinkBadgeColor,
  RichLinkBadgeColors,
} from './RichLinkBadge.types';

export const baseStyles = css`
  display: inline-flex;
  gap: ${spacing[150]}px;
  align-items: center;
  border-radius: ${spacing[100]}px;
  padding: 0px ${spacing[150]}px;
  position: absolute;
  bottom: ${spacing[200]}px;
  left: ${spacing[200]}px;
`;

export const badgeVariants: Record<
  Theme,
  Record<RichLinkBadgeColor, string>
> = {
  [Theme.Dark]: {
    [RichLinkBadgeColors.Gray]: css`
      background-color: ${palette.gray.dark1};
      & svg {
        color: ${palette.gray.light3};
      }
      & p {
        color: ${palette.gray.light3};
      }
    `,
    [RichLinkBadgeColors.Blue]: css`
      background-color: ${palette.blue.dark3};
      & svg {
        color: ${palette.blue.light2};
      }
      & p {
        color: ${palette.blue.light2};
      }
    `,
    [RichLinkBadgeColors.Green]: css`
      background-color: ${palette.green.dark3};
      & svg {
        color: ${palette.green.light2};
      }
      & p {
        color: ${palette.green.light2};
      }
    `,
    [RichLinkBadgeColors.Red]: css`
      background-color: ${palette.red.dark3};
      & svg {
        color: ${palette.red.light2};
      }
      & p {
        color: ${palette.red.light2};
      }
    `,
    [RichLinkBadgeColors.Purple]: css`
      background-color: ${palette.purple.dark3};
      & svg {
        color: ${palette.purple.light2};
      }
      & p {
        color: ${palette.purple.light2};
      }
    `,
    [RichLinkBadgeColors.Yellow]: css`
      background-color: ${palette.yellow.dark3};
      & svg {
        color: ${palette.yellow.light2};
      }
      & p {
        color: ${palette.yellow.light2};
      }
    `,
  },
  [Theme.Light]: {
    [RichLinkBadgeColors.Gray]: css`
      background-color: ${palette.gray.light2};
      & svg {
        color: ${palette.gray.dark1};
      }
      & p {
        color: ${palette.black};
      }
    `,
    [RichLinkBadgeColors.Blue]: css`
      background-color: ${palette.blue.light3};
      & svg {
        color: ${palette.blue.dark2};
      }
      & p {
        color: ${palette.blue.dark1};
      }
    `,
    [RichLinkBadgeColors.Green]: css`
      background-color: ${palette.green.light3};
      & svg {
        color: ${palette.green.dark2};
      }
      & p {
        color: ${palette.green.dark3};
      }
    `,
    [RichLinkBadgeColors.Red]: css`
      background-color: ${palette.red.light3};
      & svg {
        color: ${palette.red.dark2};
      }
      & p {
        color: ${palette.red.dark3};
      }
    `,
    [RichLinkBadgeColors.Purple]: css`
      background-color: ${palette.purple.light3};
      & svg {
        color: ${palette.purple.dark2};
      }
      & p {
        color: ${palette.purple.dark3};
      }
    `,
    [RichLinkBadgeColors.Yellow]: css`
      background-color: ${palette.yellow.light3};
      & svg {
        color: ${palette.yellow.dark2};
      }
      & p {
        color: ${palette.yellow.dark3};
      }
    `,
  },
} as const;
