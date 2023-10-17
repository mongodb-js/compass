import React, { useEffect } from 'react';
import { LGGuideCue, spacing, useId } from '@mongodb-js/compass-components';

// TODO: Is LG guide cue exported

type LGGuideCueProps = React.ComponentProps<typeof LGGuideCue>;

// Omit the props we are handling.
export type AIGuideCueProps = Omit<
  LGGuideCueProps,
  'currentStep' | 'numberOfSteps' | 'children' | 'title' | 'open' | 'setOpen'
> & {
  title?: string;
  description?: string;
  showGuideCue: boolean;
  onCloseGuideCue(): void;
};

export const AIGuideCue = ({
  title = '',
  description,
  refEl,
  showGuideCue,
  onCloseGuideCue,
}: AIGuideCueProps) => {
  const aiGuideCuePopoverId = useId();

  useEffect(() => {
    if (!showGuideCue) {
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

      onCloseGuideCue();
    };

    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [aiGuideCuePopoverId, onCloseGuideCue, refEl, showGuideCue]);

  return (
    <LGGuideCue
      spacing={spacing[3]}
      open={showGuideCue}
      setOpen={() => {
        // noop, we don't allow leafygreen to control visibility of the guide cue
      }}
      refEl={refEl}
      numberOfSteps={1}
      currentStep={1}
      onPrimaryButtonClick={onCloseGuideCue}
      onDismiss={onCloseGuideCue}
      title={title}
      data-popoverid={`ai-guide-cue-description-popover-${aiGuideCuePopoverId}`}
      buttonText="Got it"
    >
      <span data-testid="ai-guide-cue-description-span">{description}</span>
    </LGGuideCue>
  );
};
