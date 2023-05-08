const STAGE_WIZARD_KEY = 'has_seen_stage_wizard_guide_cue';
const STAGE_WIZARD_LIST_KEY = 'has_seen_stage_wizard_list_guide_cue';

const _getItem = (key: string) => {
  return localStorage.getItem(key);
};

const _setItem = (key: string, value: string) => {
  return localStorage.setItem(key, value);
};

export const hasSeenStageWizardGuideCue = (): boolean => {
  return _getItem(STAGE_WIZARD_KEY) === 'true';
};

export const setHasSeenStageWizardGuideCue = (): void => {
  _setItem(STAGE_WIZARD_KEY, 'true');
};

export const hasSeenStageWizardListGuideCue = (): boolean => {
  return _getItem(STAGE_WIZARD_LIST_KEY) === 'true';
};

export const setHasSeenStageWizardListGuideCue = (): void => {
  _setItem(STAGE_WIZARD_LIST_KEY, 'true');
};
