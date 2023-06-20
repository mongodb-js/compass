const GROUPS = [
  {
    id: 'shell-header',
    steps: 2,
  },
] as const;

export const GROUP_STEPS_MAP = new Map<GroupName, number>(
  GROUPS.map(({ id, steps }) => [id, steps])
);

export type GroupName = typeof GROUPS[number]['id'];
