import React, {
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useState,
} from 'react';
import { guideCueService, type ShowCueEventDetail } from './guide-cue-service';
import { GuideCue as LGGuideCue } from '@leafygreen-ui/guide-cue';
import type { GroupName } from './guide-cue-groups';

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

const getDataCueId = ({
  cueId,
  groupId,
}: {
  cueId: string;
  groupId?: string;
}): string => {
  return `guide-cue-${cueId}$-${groupId ?? ''}`;
};

// omit the props we are handling
export type GuideCueProps<T> = Omit<
  LGGuideCueProps,
  | 'currentStep'
  | 'refEl'
  | 'numberOfSteps'
  | 'onDismiss'
  | 'open'
  | 'onPrimaryButtonClick'
  | 'setOpen'
> &
  GroupAndStep & {
    cueId: string;
    trigger: ({ refEl }: { refEl: React.RefObject<T> }) => JSX.Element;
  };

export const GuideCue = <T extends HTMLElement>({
  children,
  trigger,
  cueId,
  groupId,
  step,
  ...restOfCueProps
}: React.PropsWithChildren<GuideCueProps<T>>) => {
  const [isOpen, setIsOpen] = useState(false);
  const intersectionRef = useRef(true);
  const refEl = useRef<T>(null);

  const cueData = useMemo(() => {
    if (!groupId) {
      return { cueId, step: 1 };
    }
    return { cueId, groupId, step };
  }, [cueId, groupId, step]);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      intersectionRef.current = entry.isIntersecting;
      if (!entry.isIntersecting && isOpen) {
        guideCueService.onNext();
      }
    },
    [isOpen, intersectionRef]
  );

  useEffect(() => {
    if (!refEl.current) {
      return;
    }
    const node = refEl.current;
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.5,
    });
    observer.observe(node);
    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [refEl, observerCallback]);

  useEffect(() => {
    const listener = ({ detail }: ShowCueEventDetail) => {
      setIsOpen(
        cueData.cueId === detail.cueId &&
          cueData.groupId === detail.groupId &&
          intersectionRef.current
      );
    };
    guideCueService.addEventListener('show-cue', listener);
    return () => {
      guideCueService.removeEventListener('show-cue', listener);
    };
  }, [setIsOpen, cueData, intersectionRef]);

  useEffect(() => {
    if (refEl.current && intersectionRef.current) {
      guideCueService.addCue(cueData);
    }
    return () => {
      guideCueService.removeCue(cueData);
    };
  }, [refEl, cueData]);

  // todo: implement the dismiss
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const listener = (event: MouseEvent) => {
      if (!refEl.current) {
        return;
      }
      const popover = document.querySelector(
        `[data-cueId="${getDataCueId(cueData)}"]`
      );
      if (!popover) {
        return;
      }
      const isClickInsidePopover = event.composedPath().includes(popover);
      if (isClickInsidePopover) {
        return;
      }

      const isClickFromRefEl = event.composedPath().includes(refEl.current);
      if (isClickFromRefEl) {
        console.log('RefEl clicked');
      } else {
        console.log('Outside clicked');
      }

      // guideCueService.markAllCuesAsVisited();
      // setIsOpen(false);
    };

    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [isOpen, cueData, refEl]);

  const onNextGroup = useCallback(() => {
    setIsOpen(false);
    guideCueService.markGroupAsVisited(cueData.groupId);
    guideCueService.onNext();
  }, [cueData]);

  const onNext = useCallback(() => {
    setIsOpen(false);
    guideCueService.markCueAsVisited(cueData.cueId, cueData.groupId);
    guideCueService.onNext();
  }, [cueData]);

  const content = useMemo(() => trigger({ refEl }), [refEl, trigger]);

  return (
    <>
      <LGGuideCue
        open={isOpen && intersectionRef.current}
        numberOfSteps={guideCueService.getCountOfSteps(cueData.groupId)}
        onDismiss={onNextGroup}
        onPrimaryButtonClick={onNext}
        setOpen={() => {
          // noop
        }}
        currentStep={cueData.step || 1}
        refEl={refEl}
        data-cueId={getDataCueId(cueData)}
        {...restOfCueProps}
      >
        {children}
      </LGGuideCue>
      {content}
    </>
  );
};
