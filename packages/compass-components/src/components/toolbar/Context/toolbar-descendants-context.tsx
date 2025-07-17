import {
  createDescendantsContext,
  useDescendantsContext,
} from '@leafygreen-ui/descendants';

export const ToolbarDescendantsContext =
  createDescendantsContext<HTMLButtonElement>('ToolbarDescendantsContext');

export function useToolbarDescendantsContext() {
  return useDescendantsContext(ToolbarDescendantsContext);
}
