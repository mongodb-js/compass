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
import { css, cx } from '../..';
import { rafraf } from '../../utils/rafraf';

const hiddenPopoverStyles = css({
  display: 'none !important',
  opacity: '0 !important',
  transition: 'none !important',
});

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
  'currentStep' | 'refEl' | 'numberOfSteps' | 'open' | 'setOpen' | 'children'
> &
  GroupAndStep & {
    description: string | React.ReactElement;
    cueId: string;
    trigger: ({ ref }: { ref: React.Ref<T> }) => React.ReactElement;
  };

export const GuideCue = <T extends HTMLElement>({
  description,
  trigger,
  cueId,
  groupId,
  step,
  onPrimaryButtonClick,
  onDismiss,
  ...restOfCueProps
}: GuideCueProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const refEl = useRef<T>(null);
  const [readyToRender, setReadyToRender] = useState(false);

  const cueData = useMemo(() => {
    if (!groupId) {
      return { cueId, step: 1 };
    }
    return { cueId, groupId, step };
  }, [cueId, groupId, step]);

  useEffect(() => {
    if (!refEl.current) {
      return;
    }
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      setIsIntersecting(entry.isIntersecting);

      if (!entry.isIntersecting) {
        setIsOpen(false);
      }

      guideCueService.onCueIntersectionChange(
        entry.isIntersecting,
        cueData.cueId,
        cueData.groupId
      );
    };

    const node = refEl.current;
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.5,
    });
    observer.observe(node);
    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [cueData]);

  useEffect(() => {
    const listener = ({ detail }: ShowCueEventDetail) => {
      setIsOpen(
        cueData.cueId === detail.cueId &&
          cueData.groupId === detail.groupId &&
          isIntersecting
      );
    };
    guideCueService.addEventListener('show-cue', listener);
    return () => {
      guideCueService.removeEventListener('show-cue', listener);
    };
  }, [cueData, isIntersecting]);

  useEffect(() => {
    if (!refEl.current) {
      return;
    }
    guideCueService.addCue({
      ...cueData,
      isIntersecting,
    });
    return () => {
      guideCueService.removeCue(cueData.cueId, cueData.groupId);
    };
  }, [cueData, isIntersecting]);

  useEffect(() => {
    // In order to ensure proper positioning, we have introduced
    // a delay in rendering the cue for a few frames. The issue at
    // hand is that the LG GC component fails to attach itself
    // correctly to the refEl element, resulting in an undesired gap
    // between the GC and refEl. Furthermore, when the position of
    // refEl changes, the GC does not adjust accordingly. This
    // somehow seems to be LG issue which we are unable to recreate.
    return rafraf(() => {
      setReadyToRender(true);
    });
  }, []);

  const onNextGroup = useCallback(() => {
    onDismiss?.();
    guideCueService.markGroupAsVisited(cueData.groupId);
    guideCueService.onNext();
  }, [cueData, onDismiss]);

  const onNext = useCallback(() => {
    onPrimaryButtonClick?.();
    guideCueService.markCueAsVisited(cueData.cueId, cueData.groupId);
    guideCueService.onNext();
  }, [cueData, onPrimaryButtonClick]);

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
        setIsOpen(false);
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
  }, [isOpen, cueData, onNext]);

  return (
    <>
      {readyToRender && (
        <LGGuideCue
          {...restOfCueProps}
          open={isOpen}
          numberOfSteps={guideCueService.getCountOfSteps(cueData.groupId)}
          onDismiss={onNextGroup}
          onPrimaryButtonClick={onNext}
          setOpen={() => setIsOpen(false)}
          currentStep={cueData.step || 1}
          refEl={refEl}
          data-cueid={getDataCueId(cueData)}
          tooltipClassName={cx(
            // Avoid flicker when the component (trigger) becomes invisible
            !isIntersecting && hiddenPopoverStyles
          )}
        >
          {description}
        </LGGuideCue>
      )}
      {trigger({ ref: refEl })}
    </>
  );
};
