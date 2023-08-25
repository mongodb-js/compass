import React, { useEffect } from 'react';
import { GuideCue as LGGuideCue } from '@leafygreen-ui/guide-cue';
import { useId } from '@react-aria/utils';

type LGGuideCueProps = React.ComponentProps<typeof LGGuideCue>;

// Omit the props we are handling.
export type AIGuideCueProps = Omit<
  LGGuideCueProps,
  'currentStep' | 'numberOfSteps' | 'children' | 'title'
> & {
  showGuideCue?: boolean;
  title?: string;
  description?: string;
  onResetIsAggregationGeneratedFromQuery?: () => void;
};

export const AIGuideCue = ({
  onResetIsAggregationGeneratedFromQuery,
  title = '',
  description,
  open,
  setOpen,
  refEl,
}: AIGuideCueProps) => {
  const aiGuideCuePopoverId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const listener = (event: MouseEvent) => {
      const popover = document.querySelector(
        `[data-popoverid="ai-guide-cue-description-popover-${aiGuideCuePopoverId}"]`
      );
      if (!popover) {
        return;
      }

      // Clicked within popover or the trigger.
      if (
        event.composedPath().includes(popover) ||
        event.composedPath().includes(refEl.current!)
      ) {
        return;
      }

      setOpen(false);
      onResetIsAggregationGeneratedFromQuery?.();
    };

    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [aiGuideCuePopoverId, open, setOpen]);

  return (
    <LGGuideCue
      open={open}
      setOpen={setOpen}
      refEl={refEl}
      numberOfSteps={1}
      currentStep={1}
      onPrimaryButtonClick={() => {
        onResetIsAggregationGeneratedFromQuery?.();
      }}
      onDismiss={() => {
        onResetIsAggregationGeneratedFromQuery?.();
      }}
      title={title}
      data-popoverid={`ai-guide-cue-description-popover-${aiGuideCuePopoverId}`}
      buttonText="Got it"
    >
      <span data-testid="ai-guide-cue-description-span">{description}</span>
    </LGGuideCue>
  );
};
