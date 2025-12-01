// Utility function for type-safe action checking
export function isAction<T extends { type: string }>(
  action: { type: string },
  type: string
): action is T {
  return action.type === type;
}
