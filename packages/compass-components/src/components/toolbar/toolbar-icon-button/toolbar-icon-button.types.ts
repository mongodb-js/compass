import type { GlyphName } from '@leafygreen-ui/icon';
import type { BaseIconButtonProps as IconButtonProps } from '@leafygreen-ui/icon-button';

type ButtonProps = Omit<
  IconButtonProps,
  | 'tabIndex'
  | 'href'
  | 'as'
  | 'ref'
  | 'children'
  | 'size'
  | 'darkMode'
  | 'onClick'
>;

export interface ToolbarIconButtonProps extends ButtonProps {
  /**
   * The LG Icon that will render in the button
   */
  glyph: GlyphName;

  /**
   * The text that will render in the tooltip on hover
   */
  label: React.ReactNode;

  /**
   *  Callback fired when the ToolbarIconButton is clicked
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
