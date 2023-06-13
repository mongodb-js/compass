// When adding data to groups, make it readonly to make
// GroupName type strict.
// export const GROUPS = [] as const; // of type {id: string, steps: number}
export const GROUPS: Array<{ id: string; steps: number }> = [];

export const GROUP_TO_STEPS = Object.fromEntries(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(GROUPS).map(([_, val]) => [val.id, val.steps])
);

export type GroupName = typeof GROUPS[number]['id'];
