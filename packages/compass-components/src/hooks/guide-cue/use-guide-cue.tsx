import React from 'react';
import { GuideCueContext } from './guide-cue-provider';

type GuideCueProps = {
  id: string;
  title: string;
  group: string;
  content: React.ReactNode;
  intersectingRef: React.RefObject<HTMLElement>;
};

export const useGuideCue = (cue: GuideCueProps) => {
  const context = React.useContext(GuideCueContext);
  const refEl = React.useRef<HTMLElement | null>(null);
  if (!context) {
    throw new Error('useGuideCue can only be used inside GuideCueContext');
  }
  React.useEffect(() => {
    if (refEl.current && cue.intersectingRef) {
      context.cueService.addCue({ ...cue, refEl });
    }
    return () => {
      context.cueService.removeCue(cue);
    };
  }, [refEl]);

  return {
    refEl,
  };
};
