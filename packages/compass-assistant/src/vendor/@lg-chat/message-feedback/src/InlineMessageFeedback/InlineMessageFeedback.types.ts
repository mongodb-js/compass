import { FormEventHandler, MouseEventHandler } from 'react';

import { BaseButtonProps } from '@mongodb-js/compass-components';
import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';
import { TextAreaProps } from '@mongodb-js/compass-components';

export type InlineMessageFeedbackProps = Required<
  Pick<TextAreaProps, 'label'>
> &
  DarkModeProps &
  Omit<HTMLElementProps<'div'>, 'children' | 'onSubmit'> & {
    /**
     * Text displayed inside the cancel Button
     *
     * @default: 'Cancel'
     * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
     */
    cancelButtonText?: string;

    /**
     * Click event handler for the cancel Button
     * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
     */
    onCancel?: MouseEventHandler<HTMLElement>;

    /**
     * Override props for the cancel Button
     * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
     */
    cancelButtonProps?: BaseButtonProps;

    /**
     * Text displayed inside the submit Button
     *
     * @default: 'Submit'
     */
    submitButtonText?: string;

    /**
     * Override props for the submit Button
     */
    submitButtonProps?: BaseButtonProps;

    /**
     * Event handler called when the form is submitted
     */
    onSubmit?: FormEventHandler<HTMLFormElement>;

    /**
     * Props passed directly to the textarea
     */
    textareaProps?: Omit<TextAreaProps, 'label'>;

    /**
     * Indicates if the component should render in its submitted state
     * @default false
     */
    isSubmitted?: boolean;

    /**
     * Message rendered in submitted state
     *
     * @default 'Submitted! Thanks for your feedback.'
     */
    submittedMessage?: string;

    /**
     * Event handler called on close button click. Close button will not be rendered when undefined.
     *
     * This is mainly for internal use as most instances of InlineMessageFeedback should be closed solely by onCancel.
     */
    onClose?: MouseEventHandler<HTMLButtonElement>;
  };
