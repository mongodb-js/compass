export const GROUPS = [
  {
    id: 'ConnectionForm',
    steps: 2,
  },
  {
    id: 'FormHelp',
    steps: 4,
  },
  {
    id: 'SidebarNavigation',
    steps: 2,
  },
  {
    id: 'Shell',
    steps: 2,
  },
  {
    id: 'Stage Toolbar',
    steps: 5,
  },
] as const;

export type GroupName = typeof GROUPS[number]['id'];

// todo: use it
export type GroupMaxStep<T extends GroupName = GroupName> = Extract<
  typeof GROUPS[number],
  { id: T }
>['steps'];
