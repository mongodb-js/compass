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

const getDataCueId = ({
  cueId,
  groupId,
}: {
  cueId: string;
  groupId?: string;
}): string => {
  return `guide-cue-${cueId}${groupId ? `-${groupId}` : ''}`;
};

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
    trigger: ({
      ref,
    }: {
      ref: React.MutableRefObject<T | null>;
    }) => React.ReactElement;
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
  const refEl = useRef<T | null>(null);

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

      guideCueService.onCueIntersectionChange(
        entry.isIntersecting,
        cueData.cueId,
        cueData.groupId
      );

      if (!entry.isIntersecting && isOpen) {
        setIsOpen(false);
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
    if (!refEl.current) {
      return;
    }
    guideCueService.addCue({
      ...cueData,
      isIntersecting: intersectionRef.current,
    });
    return () => {
      guideCueService.removeCue(cueData.cueId, cueData.groupId);
    };
  }, [refEl, cueData, intersectionRef]);

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

  useEffect(() => {
    if (!isOpen || !refEl.current) {
      return;
    }
    const listener = (event: MouseEvent) => {
      const popover = document.querySelector(
        `[data-cueid="${getDataCueId(cueData)}"]`
      );
      if (!popover) {
        return;
      }

      // Clicked within popover
      if (event.composedPath().includes(popover)) {
        return;
      }

      // Clicked within refEl
      if (event.composedPath().includes(refEl.current!)) {
        return onNext();
      }

      // Or else, user clicked outside GC
      guideCueService.markAllCuesAsVisited();
      setIsOpen(false);
    };

    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [isOpen, cueData, refEl, onNext]);

  const content = useMemo(() => trigger({ ref: refEl }), [refEl, trigger]);

  return (
    <>
      <LGGuideCue
        open={isOpen}
        numberOfSteps={guideCueService.getCountOfSteps(cueData.groupId)}
        onDismiss={onNextGroup}
        onPrimaryButtonClick={onNext}
        setOpen={() => {
          // noop
        }}
        currentStep={cueData.step || 1}
        refEl={refEl}
        data-cueid={getDataCueId(cueData)}
        {...restOfCueProps}
      >
        {children}
      </LGGuideCue>
      {content}
    </>
  );
};
