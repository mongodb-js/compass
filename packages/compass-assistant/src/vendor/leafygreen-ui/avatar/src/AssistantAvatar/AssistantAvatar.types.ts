import { LGGlyph } from '@mongodb-js/compass-components';
import { shim_lib } from '@mongodb-js/compass-components';

export type AssistantAvatarProps = LGGlyph.ComponentProps &
  shim_lib.DarkModeProps & {
    disabled?: boolean;
  };
