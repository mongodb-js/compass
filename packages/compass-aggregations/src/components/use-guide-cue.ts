import { useState, useRef, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/local-storage';
import { useInView } from 'react-intersection-observer';

export const GuideCueStorageKeys = {
  STAGE_WIZARD: 'has_seen_stage_wizard_guide_cue',
  STAGE_WIZARD_LIST: 'has_seen_stage_wizard_list_guide_cue',
} as const;

type ValueOf<T> = T[keyof T];
type GuideCueKeys = ValueOf<typeof GuideCueStorageKeys>;

const isGuideCueSeen = (key: GuideCueKeys) => {
  return getStorageItem(key) === 'true';
};

const markGuideCueAsSeen = (key: GuideCueKeys) => {
  setStorageItem(key, 'true');
};

export const useGuideCue = <T = HTMLElement>(key: GuideCueKeys) => {
  const cueRefEl = useRef<T | null>(null);
  const [cueIntersectingRef, isIntersecting] = useInView({
    threshold: 0.5,
  });
  const [isCueVisible, setIsCueVisible] = useState(false);

  useEffect(() => {
    // Only show guide cue when it has not been seen, the reference
    // element is in the dom and is in viewport.
    setIsCueVisible(
      Boolean(cueRefEl.current) && !isGuideCueSeen(key) && isIntersecting
    );
  }, [cueRefEl, isIntersecting]);

  return {
    cueRefEl,
    cueIntersectingRef,
    isCueVisible,
    markCueVisited: () => {
      setIsCueVisible(false);
      markGuideCueAsSeen(key);
    },
  };
};
