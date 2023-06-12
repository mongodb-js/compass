import React from 'react';
import {
  guideCueService,
  type ShowCueEventDetail,
  type GroupName,
} from './guide-cue-service';
import { LGGuideCue } from '../..';

type LGGuideCueProps = React.ComponentProps<typeof LGGuideCue>;

type GroupAndStep =
  | {
      groupId: GroupName;
      step: number;
    }
  | {
      groupId?: never;
      step?: never;
    };

export type GuideCueProps<T> = Pick<
  LGGuideCueProps,
  | 'beaconAlign'
  | 'tooltipAlign'
  | 'tooltipJustify'
  | 'tooltipClassName'
  | 'buttonText'
> &
  GroupAndStep & {
    cueId: string;
    title: string;
    onClick?: LGGuideCueProps['onPrimaryButtonClick'];
    trigger: ({
      refEl,
      isOpen,
    }: {
      refEl: React.RefObject<T>;
      isOpen: boolean;
    }) => JSX.Element;
  };

export const GuideCue = <T extends HTMLElement>({
  children,
  trigger,
  cueId,
  groupId,
  step,
  onClick: onCueActionClick,
  ...cue
}: React.PropsWithChildren<GuideCueProps<T>>) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isIntersecting, setIsIntersecting] = React.useState(true);
  const refEl = React.createRef<T>();

  const cueData = React.useMemo(() => {
    if (!groupId) {
      return { cueId, step: 1 };
    }
    return { cueId, groupId, step };
  }, [cueId, groupId, step]);

  const observerCallback = React.useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      setIsIntersecting(entry.isIntersecting);
      guideCueService.updateCueIntersection(entry.isIntersecting, cueData);
      if (!entry.isIntersecting && isOpen) {
        guideCueService.onNext();
      }
    },
    [setIsIntersecting, isOpen, cueData]
  );

  React.useEffect(() => {
    if (!refEl.current) {
      return;
    }
    const node = refEl.current;
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 1,
    });
    observer.observe(node);
    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [refEl, observerCallback, cueData]);

  React.useEffect(() => {
    const listener = ({ detail }: ShowCueEventDetail) => {
      setIsOpen(
        cueData.cueId === detail.cueId && cueData.groupId === detail.groupId
      );
    };
    guideCueService.addEventListener('show-cue', listener);
    return () => {
      guideCueService.removeEventListener('show-cue', listener);
    };
  }, [setIsOpen, cueData]);

  React.useEffect(() => {
    if (refEl.current) {
      guideCueService.addCue(cueData);
    }
    return () => {
      guideCueService.removeCue(cueData);
    };
  }, [refEl, cueData]);

  const onNextGroup = React.useCallback(() => {
    setIsOpen(false);
    guideCueService.markGroupAsVisited(cueData.groupId);
    guideCueService.onNext();
  }, [cueData]);

  const onNext = React.useCallback(() => {
    setIsOpen(false);
    guideCueService.markCueAsVisited(cueData.cueId, cueData.groupId);
    guideCueService.onNext();

    onCueActionClick?.();
  }, [onCueActionClick, cueData]);

  const props = React.useMemo(
    () => ({
      ...cue,
      popoverZIndex: 4,
    }),
    [cue]
  );

  const content = React.useMemo(
    () => trigger({ refEl, isOpen }),
    [refEl, isOpen, trigger]
  );

  return (
    <>
      <LGGuideCue
        open={isOpen && isIntersecting}
        numberOfSteps={guideCueService.getCountOfSteps(cueData.groupId)}
        onDismiss={onNextGroup}
        onPrimaryButtonClick={onNext}
        setOpen={() => {
          //
        }}
        currentStep={cueData.step || 1}
        refEl={refEl}
        {...props}
      >
        {children}
      </LGGuideCue>
      {content}
    </>
  );
};
