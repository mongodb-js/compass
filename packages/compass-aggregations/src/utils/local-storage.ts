const FOCUS_MODE_KEY = 'has_seen_focus_mode_guide_cue';

export const hasSeenFocusModeGuideCue = (): boolean => {
  return localStorage.getItem(FOCUS_MODE_KEY) === 'true';
};

export const setHasSeenFocusModeGuideCue = (): void => {
  localStorage.setItem(FOCUS_MODE_KEY, 'true');
};
