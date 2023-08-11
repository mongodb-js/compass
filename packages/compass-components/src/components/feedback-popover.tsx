import React, { useCallback, useEffect, useState } from 'react';
import { GuideCue as LGGuideCue } from '@leafygreen-ui/guide-cue';

import { TextArea, css, spacing, useId } from '..';

const guideCueStyles = css({
  minWidth: spacing[7] * 4,
});

type LGGuideCueProps = React.ComponentProps<typeof LGGuideCue>;

// Omit the props we are handling.
export type FeedbackPopoverProps = Omit<
  LGGuideCueProps,
  'currentStep' | 'numberOfSteps' | 'children' | 'title'
> & {
  onSubmitFeedback: (text: string) => void;
  placeholder: string;
  label: string;
};

export const FeedbackPopover = ({
  onSubmitFeedback,
  label,
  placeholder,
  setOpen,
  open,
  ...props
}: FeedbackPopoverProps) => {
  const [feedbackText, setFeedbackText] = useState('');
  const feedbackPopoverId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const listener = (event: MouseEvent) => {
      const popover = document.querySelector(
        `[data-popoverid="feedback-popover-${feedbackPopoverId}"]`
      );
      if (!popover) {
        return;
      }

      // Clicked within popover.
      if (event.composedPath().includes(popover)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [feedbackPopoverId, open, setOpen]);

  const onTextAreaKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (evt.key === 'Enter' && !evt.shiftKey) {
        evt.preventDefault();
        onSubmitFeedback(feedbackText);
      } else if (evt.key === 'Escape') {
        evt.preventDefault();
        setOpen(false);
      }
    },
    [feedbackText, setOpen, onSubmitFeedback]
  );

  return (
    <LGGuideCue
      tooltipClassName={guideCueStyles}
      numberOfSteps={1}
      currentStep={1}
      data-popoverid={`feedback-popover-${feedbackPopoverId}`}
      title=""
      tooltipAlign="bottom"
      onPrimaryButtonClick={() => onSubmitFeedback(feedbackText)}
      buttonText="Submit"
      setOpen={setOpen}
      open={open}
      {...props}
    >
      <TextArea
        label={label}
        data-testid="feedback-popover-textarea"
        placeholder={placeholder}
        value={feedbackText}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
          setFeedbackText(event.target.value)
        }
        onKeyDown={onTextAreaKeyDown}
      />
    </LGGuideCue>
  );
};
