import { DarkModeProps } from '@mongodb-js/compass-components';

export const ChatAvatarVariant = {
  /**
   * Renders a MongoDB logo mark
   */
  Mongo: 'mongo',
  /**
   * Renders the user's name
   */
  User: 'user',
  /**
   * Renders a person icon
   */
  Default: 'default',
} as const;

export type ChatAvatarVariant =
  typeof ChatAvatarVariant[keyof typeof ChatAvatarVariant];

export const ChatAvatarSize = {
  Small: 'small',
  Default: 'default',
} as const;

export type ChatAvatarSize = typeof ChatAvatarSize[keyof typeof ChatAvatarSize];

export interface ChatAvatarProps extends DarkModeProps {
  /**
   * If provided, overrides the size prop to a customizable number (in px)
   */
  sizeOverride?: number;
  /**
   * Determines the size of the avatar
   * @default Size.Default
   */
  size?: ChatAvatarSize;
  /**
   * The name of the user who is represented by the avatar. The rendered text will be the initials of the text passed to this prop.
   */
  name?: string;
  /**
   * Determines the Avatar component's variant.
   */
  variant?: ChatAvatarVariant;
}
