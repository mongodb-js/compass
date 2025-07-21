export const DEFAULT_LGID_ROOT = 'lg-toolbar';

export const getLgIds = (root: `lg-${string}` = DEFAULT_LGID_ROOT) => {
  const ids = {
    root,
    iconButton: `${root}-icon_button`,
    iconButtonTooltip: `${root}-icon_button-tooltip`,
  } as const;
  return ids;
};

export type GetLgIdsReturnType = ReturnType<typeof getLgIds>;
