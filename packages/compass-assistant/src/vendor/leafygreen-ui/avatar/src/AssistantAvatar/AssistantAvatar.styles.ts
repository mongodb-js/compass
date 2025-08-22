import { shim_Theme } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';
const { color, InteractionState, Variant } = shim_tokens;

export const getDisabledFill = (theme: shim_Theme) => {
  return color[theme].icon[Variant.Disabled][
    InteractionState.Default
  ] as string;
};
