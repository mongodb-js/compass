import React from 'react';
import { GuideCue as LGGuideCue } from '../..';
import {
  guideCueService,
  type CueRemovedEventDetail,
  type CueGroupUpdatedEventDetail,
  type CueGroup,
} from './guide-cue-service';

export const GuideCueContext = React.createContext<{ isMounted: boolean }>({
  isMounted: false,
});

const CompassGuideCue = ({ children }: React.PropsWithChildren<{}>) => {
  const [cueGroup, setCueGroup] = React.useState<CueGroup | null>(null);
  const [currentCueIndex, setCurrentCueIndex] = React.useState(0);
  const [hasMoreCues, setHasMoreCues] = React.useState(false);

  React.useEffect(() => {
    if (hasMoreCues && !cueGroup) {
      setUpNextGroup();
    }
  }, [hasMoreCues, cueGroup]);

  // listener
  React.useEffect(() => {
    const listener = () => setHasMoreCues(true);
    guideCueService.addEventListener('cue-added', listener);
    return () => {
      guideCueService.removeEventListener('cue-added', listener);
    };
  }, [setHasMoreCues]);
  // listener
  React.useEffect(() => {
    const listener = ({
      detail: { cueId, groupId },
    }: CueRemovedEventDetail) => {
      if (
        groupId === cueGroup?.id &&
        cueGroup?.cues.find((cue) => cue.id === cueId)
      ) {
        setCueGroup(null);
      }
    };
    guideCueService.addEventListener('cue-removed', listener);
    return () => {
      guideCueService.removeEventListener('cue-removed', listener);
    };
  }, [cueGroup]);
  // listener
  React.useEffect(() => {
    const listener = ({
      detail: { group: newGroup },
    }: CueGroupUpdatedEventDetail) => {
      setCueGroup(newGroup);
    };
    guideCueService.addEventListener('cue-group-updated', listener);
    return () => {
      guideCueService.removeEventListener('cue-group-updated', listener);
    };
  }, [cueGroup]);

  const setUpNextGroup = React.useCallback(() => {
    const newGroup = guideCueService.getNextGroup();
    setCurrentCueIndex(0);
    setCueGroup(newGroup);
    if (!newGroup) {
      setHasMoreCues(false);
    }
  }, []);

  const onNext = React.useCallback(() => {
    if (!cueGroup) {
      return;
    }

    // Update in storage
    const cueId = cueGroup.cues[currentCueIndex].id;
    guideCueService.markCueAsVisited(cueId, cueGroup.id);

    const nextCueIndex = cueGroup.cues.findIndex(
      (x, i) => i > currentCueIndex && x.isIntersecting
    );

    if (nextCueIndex === -1) {
      setUpNextGroup();
    } else {
      setCurrentCueIndex(nextCueIndex);
    }
  }, [currentCueIndex, cueGroup]);

  const onNextGroup = React.useCallback(() => {
    if (cueGroup?.id) {
      guideCueService.markGroupAsVisited(cueGroup.id);
    }
    setUpNextGroup();
  }, [cueGroup]);

  const contextValue = React.useMemo(() => ({ isMounted: true }), []);

  return (
    <GuideCueContext.Provider value={contextValue}>
      {cueGroup?.cues.map((cue, index) => (
        <LGGuideCue
          key={cue.id}
          title={cue.title}
          refEl={cue.refEl}
          numberOfSteps={cueGroup.steps}
          currentStep={currentCueIndex + 1}
          open={currentCueIndex === index}
          setOpen={() => {
            // noop
          }}
          onDismiss={() => onNextGroup()}
          onPrimaryButtonClick={() => onNext()}
          popoverZIndex={4}
          beaconAlign={cue.beaconAlign}
          tooltipAlign={cue.tooltipAlign}
          tooltipClassName={cue.tooltipClassName}
          tooltipJustify={cue.tooltipJustify}
        >
          {/* todo: add content instead of title */}
          {cue.title}
        </LGGuideCue>
      ))}
      {children}
    </GuideCueContext.Provider>
  );
};

export const GuideCueProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const hasParentContext = React.useContext(GuideCueContext)?.isMounted;

  if (hasParentContext) {
    return <>{children}</>;
  }

  return <CompassGuideCue>{children}</CompassGuideCue>;
};
