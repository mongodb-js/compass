import { shim_lib } from '@mongodb-js/compass-components';
import { PopoverProps } from '@mongodb-js/compass-components';

import { InlineMessageFeedbackProps } from '../InlineMessageFeedback';

export type PopoverMessageFeedbackProps = shim_lib.DarkModeProps &
  Omit<InlineMessageFeedbackProps, 'isSubmitted' | 'submittedMessage'> &
  Omit<PopoverProps, 'children'> & {
    /**
     * Number that controls the z-index of the popover
     */
    popoverZIndex?: number;
  };
