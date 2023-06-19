// When adding data to groups, make it readonly to make
// GroupName type strict.
// const GROUPS = [] as const; // of type {id: string, steps: number}
const GROUPS: Array<{ id: string; steps: number }> = [];

export const GROUP_STEPS_MAP = new Map<GroupName, number>(
  GROUPS.map(({ id, steps }) => [id, steps])
);

export type GroupName = typeof GROUPS[number]['id'];
