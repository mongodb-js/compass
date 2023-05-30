import React from 'react';
import { GuideCue as LGGuideCue } from '../..';
import { useInView } from 'react-intersection-observer';
import { GuideCueService, type Cue } from './guide-cue-service';
import { type GuideCueStorage } from './guide-cue-storage';

export const GuideCueContext = React.createContext<
  | {
      cueService: GuideCueService;
    }
  | undefined
>(undefined);

export const GuideCueProvider = ({
  children,
}: // storage,
React.PropsWithChildren<{ storage?: GuideCueStorage }>) => {
  // todo: inject storage in service.
  const serviceRef = React.useRef(new GuideCueService());

  const [cue, setCue] = React.useState<Cue | null>(null);

  const [cueIntersectingRef, isIntersecting] = useInView({
    threshold: 0.5,
    delay: 100,
  });

  const setupCue = React.useCallback(() => {
    if (!cue) {
      const newCue = serviceRef.current.getNextCue();
      if (newCue) {
        cueIntersectingRef(newCue.intersectingRef.current);
      }
      setCue(newCue);
    }
  }, [cue, cueIntersectingRef, setCue]);

  // Get the next cue when current one is set to null
  // by any action within this component (onNext or onNextGroup)
  React.useEffect(() => {
    setupCue();
  }, [cue, setupCue]);

  // the recursion cause
  React.useEffect(() => {
    // if (cue && !isIntersecting) {
    //   serviceRef.current.moveToNextGroup();
    //   setCue(null);
    // }
  }, [cue, isIntersecting]);

  // Listen when a new cue is added. If we are not showing
  // any cue when its added, try to fetch next one, or else
  // users interaction with GuideCue will fetch the next.
  React.useEffect(() => {
    const service = serviceRef.current;
    const listener = () => {
      setupCue();
    };
    service.addEventListener('cue-list-changed', listener);
    return () => {
      service.removeEventListener('cue-list-changed', listener);
    };
  }, [setupCue]);

  const onNext = React.useCallback(() => {
    console.log('GuideCueProvider.onNext');
    if (cue) {
      serviceRef.current.markCueAsVisited(cue);
    }
    // todo: fix
    setCue(null);
  }, [cue]);

  const onNextGroup = React.useCallback(() => {
    console.log('GuideCueProvider.onNextGroup');
    if (cue) {
      serviceRef.current.markGroupAsVisited(cue.group);
    }
    serviceRef.current.moveToNextGroup();
    setCue(null);
  }, [cue]);

  console.log('GuideCueProvider.render ');

  return (
    <GuideCueContext.Provider value={{ cueService: serviceRef.current }}>
      {cue && (
        <LGGuideCue
          title={cue.title}
          refEl={cue.refEl}
          numberOfSteps={serviceRef.current.numOfCuesInGroup}
          currentStep={serviceRef.current.currentCueIndex + 1}
          open={isIntersecting}
          setOpen={() => {
            // noop
          }}
          onDismiss={() => onNextGroup()}
          onPrimaryButtonClick={() => onNext()}
          popoverZIndex={20}
        >
          {cue.content}
        </LGGuideCue>
      )}
      {children}
    </GuideCueContext.Provider>
  );
};
