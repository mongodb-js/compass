import React from 'react';
import { GuideCue as LGGuideCue } from '../..';
import { GuideCueService, type Cue } from './guide-cue-service';
import { type GuideCueStorage } from './guide-cue-storage';

export const GuideCueContext = React.createContext<
  | {
      cueService: GuideCueService;
    }
  | undefined
>(undefined);

const OBSERVER_OPTIONS = {};

export const GuideCueProvider = ({
  children,
  storage,
}: React.PropsWithChildren<{ storage: GuideCueStorage }>) => {
  const serviceRef = React.useRef(new GuideCueService(storage));

  const [cue, setCue] = React.useState<Cue | null>(null);
  const [hasMoreCues, setHasMoreCues] = React.useState(true);

  /**
   * IntersectionObserver callback to determine if the intersectingRef
   * of the current cue is visible. If not, we don't show the Guide Cue.
   */
  const observerCallback = React.useCallback((entries) => {
    const [entry] = entries;
    if (!entry.isIntersecting) {
      serviceRef.current.markCueAsNotIntersecting();
      setCue(null);
    }
  }, []);

  /**
   * Effect to keep track of the visibility of the intersectingRef
   * of the current cue.
   */
  React.useEffect(() => {
    if (!cue) {
      return;
    }
    const observer = new IntersectionObserver(
      observerCallback,
      OBSERVER_OPTIONS
    );
    if (cue.intersectingRef.current) {
      observer.observe(cue.intersectingRef.current);
    }
    return () => {
      if (cue.intersectingRef.current) {
        observer.unobserve(cue.intersectingRef.current);
      }
      observer.disconnect();
    };
  }, [cue]);

  /**
   * Effect to fetch the next cue. If we already have a cue or there
   * are no more cues, we don't fetch anything.
   */
  React.useEffect(() => {
    if (cue || !hasMoreCues) {
      return;
    }
    const nextCue = serviceRef.current.getNextCue();
    if (!nextCue) {
      setHasMoreCues(false);
      setCue(null);
      return;
    }
    setCue(nextCue);
  }, [cue, hasMoreCues]);

  /**
   * Listener when a new cue is added to the list.
   */
  React.useEffect(() => {
    const service = serviceRef.current;
    const listener = () => setHasMoreCues(true);
    service.addEventListener('cue-added', listener);
    return () => {
      service.removeEventListener('cue-added', listener);
    };
  }, [setHasMoreCues]);

  const onNext = React.useCallback(() => {
    serviceRef.current.markCueAsVisited();
    setCue(null);
  }, []);

  const onNextGroup = React.useCallback(() => {
    serviceRef.current.markGroupAsVisited();
    setCue(null);
  }, []);

  console.log('GuideCueProvider.render', cue);

  return (
    <GuideCueContext.Provider value={{ cueService: serviceRef.current }}>
      {cue && (
        <LGGuideCue
          title={cue.title}
          refEl={cue.refEl}
          numberOfSteps={serviceRef.current.numOfCuesInGroup}
          currentStep={serviceRef.current.currentCueIndexInGroup + 1}
          open={true}
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
