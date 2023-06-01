import React from 'react';
import { GuideCueContext } from './guide-cue-provider';

type GuideCueProps = {
  id: string;
  title: string;
  groupId: string;
  content: React.ReactNode;
  intersectingRef: React.RefObject<HTMLElement>;
};

export const useGuideCue = (cues: GuideCueProps[]) => {
  const context = React.useContext(GuideCueContext);
  const refs = Array.from({ length: cues.length }, () =>
    React.createRef<HTMLElement>()
  );
  if (!context) {
    throw new Error('useGuideCue can only be used inside GuideCueContext');
  }
  React.useEffect(() => {
    if (!context.cueService) {
      return;
    }
    cues.forEach((cue, index) => {
      if (refs[index].current && cue.intersectingRef) {
        context.cueService!.addCue({ ...cue, refEl: refs[index] });
      }
    });
    return () => {
      context.cueService!.removeCues(cues);
    };
  }, [refs, cues]);

  return refs;
};
