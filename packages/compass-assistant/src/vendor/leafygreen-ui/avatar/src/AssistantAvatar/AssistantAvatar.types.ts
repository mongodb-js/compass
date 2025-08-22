import { LGGlyph } from '@leafygreen-ui/icon';
import { DarkModeProps } from '@leafygreen-ui/lib';

export type AssistantAvatarProps = LGGlyph.ComponentProps &
  DarkModeProps & {
    disabled?: boolean;
  };
