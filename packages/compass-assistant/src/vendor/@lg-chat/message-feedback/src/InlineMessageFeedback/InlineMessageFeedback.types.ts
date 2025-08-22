import { FormEventHandler, MouseEventHandler } from 'react';

import {
  shim_lib,
  shim_button,
  shim_textarea,
} from '@mongodb-js/compass-components';

export type InlineMessageFeedbackProps = Required<
  Pick<shim_textarea.TextAreaProps, 'label'>
> &
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  shim_lib.DarkModeProps &
  Omit<shim_lib.HTMLElementProps<'div'>, 'children' | 'onSubmit'> & {
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
    cancelButtonProps?: shim_button.ButtonProps;

    /**
     * Text displayed inside the submit Button
     *
     * @default: 'Submit'
     */
    submitButtonText?: string;

    /**
     * Override props for the submit Button
     */
    submitButtonProps?: shim_button.ButtonProps;

    /**
     * Event handler called when the form is submitted
     */
    onSubmit?: FormEventHandler<HTMLFormElement>;

    /**
     * Props passed directly to the textarea
     */
    textareaProps?: Omit<shim_textarea.TextAreaProps, 'label'>;

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
