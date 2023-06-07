import React from 'react';
import { guideCueService } from './guide-cue-service';
import { type GuideCue as LGGuideCue } from '../..';

type LGGuideCueProps = React.ComponentProps<typeof LGGuideCue>;

const GuideCueGroupContext = React.createContext<
  | undefined
  | {
      id: string;
      steps: number;
    }
>(undefined);

type GuideCueGroupProps = {
  id: string;
  steps: number;
};
export const GuideCueGroup = ({
  id,
  steps,
  children,
}: React.PropsWithChildren<GuideCueGroupProps>) => {
  React.useLayoutEffect(() => {
    guideCueService.addGroup({ id, steps });
    return () => {
      guideCueService.removeGroup(id);
    };
  }, []);

  const value = React.useMemo(() => ({ id, steps }), []);

  return (
    <GuideCueGroupContext.Provider value={value}>
      {children}
    </GuideCueGroupContext.Provider>
  );
};

export type GuideCueProps = Pick<
  LGGuideCueProps,
  'beaconAlign' | 'tooltipAlign' | 'tooltipJustify' | 'tooltipClassName'
> & {
  id: string;
  step: number;
  title: string;
};

export const GuideCue = ({
  children,
  ...cue
}: React.PropsWithChildren<GuideCueProps>) => {
  const group = React.useContext(GuideCueGroupContext);
  const refEl = React.createRef<HTMLSpanElement>();
  React.useEffect(() => {
    if (refEl.current) {
      guideCueService.addCue({ ...cue, refEl }, group?.id);
    }
    return () => {
      guideCueService.removeCue(cue.id, group?.id);
    };
  }, [refEl]);

  const observerCallback = React.useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      guideCueService.updateCueIntersection(
        entry.isIntersecting,
        cue.id,
        group?.id
      );
    },
    [cue]
  );

  React.useEffect(() => {
    if (!refEl.current) {
      return;
    }
    const observer = new IntersectionObserver(observerCallback, {});
    observer.observe(refEl.current);
    return () => {
      refEl.current && observer.unobserve(refEl.current);
      observer.disconnect();
    };
  }, [refEl]);

  return <span ref={refEl}>{children}</span>;
};
