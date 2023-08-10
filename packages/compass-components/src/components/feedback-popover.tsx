import React, { useState } from 'react';
import { GuideCue as LGGuideCue } from '@leafygreen-ui/guide-cue';

import { TextArea, css, spacing } from '..';

const guideCueStyles = css({
  minWidth: spacing[7] * 4,
});

type LGGuideCueProps = React.ComponentProps<typeof LGGuideCue>;

// Omit the props we are handling.
export type FeedbackPopoverProps = Omit<
  LGGuideCueProps,
  'currentStep' | 'numberOfSteps' | 'children' | 'title'
> & {
  onFeedback: (text: string) => void;
  placeholder: string;
  label: string;
};

export const FeedbackPopover = ({
  onFeedback,
  label,
  placeholder,
  ...props
}: FeedbackPopoverProps) => {
  const [feedbackText, setFeedbackText] = useState('');

  return (
    <LGGuideCue
      tooltipClassName={guideCueStyles}
      numberOfSteps={1}
      currentStep={1}
      title=""
      tooltipAlign="bottom"
      onPrimaryButtonClick={() => onFeedback(feedbackText)}
      buttonText="Submit"
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
      />
    </LGGuideCue>
  );
};
