import React from 'react';
import { type GuideCue as LGGuideCue } from '../..';
import { GuideCueContext } from './guide-cue-provider';

type LGGuideCueProps = React.ComponentProps<typeof LGGuideCue>;

type GuideCueBaseProps = Pick<
  LGGuideCueProps,
  'beaconAlign' | 'tooltipAlign' | 'tooltipJustify' | 'tooltipClassName'
>;

export type GuideCueProps = Partial<GuideCueBaseProps> & {
  id: string;
  title: string;
  groupId: string;
  content: React.ReactNode;
  intersectingRef: React.RefObject<HTMLElement>;
  priority?: number;
};

type GuideCueRef<T> = {
  [K in keyof T]: React.RefObject<T[K]>;
};

export const useGuideCue = <T extends HTMLElement[] = HTMLDivElement[]>(
  cues: GuideCueProps[]
) => {
  const context = React.useContext(GuideCueContext);
  const refs = Array.from({ length: cues.length }, () =>
    React.createRef()
  ) as GuideCueRef<T>;
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
