import { Theme } from '@leafygreen-ui/lib';
import { color, InteractionState, Variant } from '@leafygreen-ui/tokens';

export const getDisabledFill = (theme: Theme) => {
  return color[theme].icon[Variant.Disabled][InteractionState.Default];
};
