import React, {
  ChangeEventHandler,
  FormEventHandler,
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  useRef,
  useState,
} from 'react';
import {
  useLeafyGreenChatContext,
  Variant,
} from '@lg-chat/leafygreen-chat-provider';

import { shim_button, Button, Icon } from '@mongodb-js/compass-components';
const { Size: ButtonSize, Variant: ButtonVariant } = shim_button;
import { shim_hooks } from '@mongodb-js/compass-components';
const { useIdAllocator } = shim_hooks;
import { IconButton } from '@mongodb-js/compass-components';
import {
  LeafyGreenProvider,
  shim_useDarkMode,
} from '@mongodb-js/compass-components';
import { TextArea } from '@mongodb-js/compass-components';
import { Label } from '@mongodb-js/compass-components';

import { SubmittedState } from './SubmittedState/SubmittedState';
import {
  actionContainerStyles,
  getBodyContainerStyles,
  getFormContainerStyles,
  getHeaderContainerStyles,
  getTextAreaStyles,
  labelStyles,
} from './InlineMessageFeedback.styles';
import { InlineMessageFeedbackProps } from '.';

export const InlineMessageFeedback = forwardRef(
  (
    {
      className,
      label,
      cancelButtonText = 'Cancel',
      onCancel,
      cancelButtonProps,
      submitButtonText = 'Submit',
      submitButtonProps,
      isSubmitted,
      submittedMessage = 'Submitted! Thanks for your feedback.',
      onSubmit: onSubmitProp,
      darkMode: darkModeProp,
      onClose,
      textareaProps,
      ...rest
    }: InlineMessageFeedbackProps,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) => {
    const { darkMode, theme } = shim_useDarkMode(darkModeProp);
    const { variant } = useLeafyGreenChatContext();
    const isCompact = variant === Variant.Compact;

    // if (isCompact && (cancelButtonProps || cancelButtonText || onCancel)) {
    //   consoleOnce.warn(
    //     `@lg-chat/message-rating: The MessageRating component's props 'cancelButtonProps', 'cancelButtonText', and 'onCancel' are only used in the 'spacious' variant. It will not be rendered in the 'compact' variant set by the provider.`
    //   );
    // }

    const textareaId = useIdAllocator({ prefix: 'lg-chat-imf-input' });
    const labelId = useIdAllocator({ prefix: 'lg-chat-imf-label' });
    const textareaRef: MutableRefObject<HTMLTextAreaElement | null> =
      useRef<HTMLTextAreaElement>(null);

    const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
      e.preventDefault();
      onSubmitProp?.(e);
    };

    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
      setHasEmptyTextarea(isTextareaEmpty());
      textareaProps?.onChange?.(e);
    };

    const isTextareaEmpty = () =>
      (textareaProps?.value === undefined || textareaProps?.value.length < 1) &&
      (textareaRef?.current?.value === undefined ||
        textareaRef?.current?.value.length < 1);

    const [hasEmptyTextarea, setHasEmptyTextarea] = useState<boolean>(
      isTextareaEmpty()
    );

    const showCancelButton = !isCompact && !!onCancel;

    return (
      <LeafyGreenProvider darkMode={darkMode}>
        <div className={className} ref={forwardedRef} {...rest}>
          {isSubmitted ? (
            <SubmittedState submittedMessage={submittedMessage} />
          ) : (
            <form
              className={getFormContainerStyles({ isCompact, theme })}
              onSubmit={handleSubmit}
            >
              <div className={getHeaderContainerStyles({ isCompact })}>
                {/* @ts-ignore htmlFor not necessary since aria-labelledby is used on TextArea */}
                <Label id={labelId} className={labelStyles}>
                  {label}
                </Label>
                {onClose && (
                  <IconButton
                    aria-label="Close feedback window"
                    onClick={onClose}
                  >
                    <Icon glyph="X" />
                  </IconButton>
                )}
              </div>
              <div className={getBodyContainerStyles({ isCompact })}>
                <TextArea
                  id={textareaId}
                  aria-labelledby={labelId}
                  /* eslint-disable-next-line jsx-a11y/no-autofocus */
                  autoFocus={true}
                  {...textareaProps}
                  className={getTextAreaStyles(textareaProps?.className)}
                  ref={(el: HTMLTextAreaElement) => {
                    if (textareaProps?.ref) {
                      (
                        textareaProps.ref as MutableRefObject<HTMLTextAreaElement>
                      ).current = el;
                    }
                    textareaRef.current = el;
                  }}
                  onChange={handleChange}
                />
                <div className={actionContainerStyles}>
                  {showCancelButton && (
                    <Button
                      type="button"
                      variant={ButtonVariant.Default}
                      size={ButtonSize.Small}
                      onClick={onCancel}
                      {...cancelButtonProps}
                    >
                      {cancelButtonText}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant={ButtonVariant[isCompact ? 'Default' : 'Primary']}
                    size={ButtonSize[isCompact ? 'Default' : 'Small']}
                    disabled={!!hasEmptyTextarea}
                    {...submitButtonProps}
                  >
                    {submitButtonText}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </LeafyGreenProvider>
    );
  }
);

InlineMessageFeedback.displayName = 'InlineMessageFeedback';
