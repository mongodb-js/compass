import { GlyphName } from '@mongodb-js/compass-components';
import { shim_lib } from '@mongodb-js/compass-components';
import { BaseFontSize } from '@mongodb-js/compass-components';

export { BaseFontSize };

export const RichLinkBadgeColors = {
  Gray: 'gray',
  Blue: 'blue',
  Green: 'green',
  Purple: 'purple',
  Red: 'red',
  Yellow: 'yellow',
} as const;
export type RichLinkBadgeColor =
  typeof RichLinkBadgeColors[keyof typeof RichLinkBadgeColors];

export interface RichLinkBadgeProps extends shim_lib.DarkModeProps {
  /**
   * The badge's label text
   */
  label: React.ReactNode;

  /**
   * The name of the glyph to display in the badge
   */
  glyph?: GlyphName;

  /**
   * Determines the base font-size of the component
   *
   * @default 13
   */
  baseFontSize?: BaseFontSize;

  /**
   * The background color of the badge
   * @default 'gray'
   */
  color?: RichLinkBadgeColor;
}
