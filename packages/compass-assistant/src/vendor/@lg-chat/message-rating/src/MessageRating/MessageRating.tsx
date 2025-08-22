import React, { ForwardedRef, forwardRef, useCallback, useRef } from 'react';
import {
  useLeafyGreenChatContext,
  Variant,
} from '@lg-chat/leafygreen-chat-provider';

import {
  useControlledValue,
  useIdAllocator,
} from '@mongodb-js/compass-components';
import ThumbsDown from '@mongodb-js/compass-components';
import ThumbsUp from '@mongodb-js/compass-components';
import IconButton from '@mongodb-js/compass-components';
import LeafyGreenProvider, {
  shim_useDarkMode,
} from '@mongodb-js/compass-components';
import { consoleOnce } from '@mongodb-js/compass-components';
import { Description } from '@mongodb-js/compass-components';

import { RadioButton } from '../RadioButton/RadioButton';

import {
  buttonContainerStyles,
  getContainerStyles,
  getHiddenStyles,
  getIconButtonStyles,
  getIconFill,
} from './MessageRating.styles';
import {
  type MessageRatingProps,
  MessageRatingValue,
} from './MessageRating.types';

export const MessageRating = forwardRef(
  (
    {
      className,
      darkMode: darkModeProp,
      description = 'How was the response?',
      hideThumbsDown = false,
      hideThumbsUp = false,
      onChange,
      value: valueProp,
      ...rest
    }: MessageRatingProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const { darkMode } = shim_useDarkMode(darkModeProp);
    const { variant } = useLeafyGreenChatContext();
    const isCompact = variant === Variant.Compact;

    if (isCompact && description) {
      consoleOnce.warn(
        `@lg-chat/message-rating: The MessageRating component's prop 'description' is only used in the 'spacious' variant. It will not be rendered in the 'compact' variant set by the provider.`
      );
    }

    const likeButtonRef = useRef<HTMLButtonElement>(null);
    const dislikeButtonRef = useRef<HTMLButtonElement>(null);

    const { value, handleChange, updateValue } = useControlledValue<
      MessageRatingProps['value']
    >(valueProp, onChange, MessageRatingValue.Unselected);
    const inputName = useIdAllocator({
      prefix: 'message-rating',
    });

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>, val: MessageRatingValue) => {
        e.preventDefault();

        if (!isCompact) {
          return;
        }

        const refToUpdate =
          val === MessageRatingValue.Liked ? likeButtonRef : dislikeButtonRef;

        updateValue(val, refToUpdate);
      },
      [isCompact, updateValue]
    );

    const handleLikeClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e, MessageRatingValue.Liked);
      },
      [handleClick]
    );

    const handleDislikeClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e, MessageRatingValue.Disliked);
      },
      [handleClick]
    );

    const isLiked = value === 'liked';
    const isDisliked = value === 'disliked';

    return (
      <LeafyGreenProvider darkMode={darkMode}>
        <div className={getContainerStyles(className)} {...rest} ref={ref}>
          {!isCompact && <Description>{description}</Description>}
          <div
            aria-label="Message rating"
            className={buttonContainerStyles}
            role="radiogroup"
          >
            {isCompact ? (
              <IconButton
                id={`like-${inputName}`}
                aria-label="Like this message"
                title="Helpful"
                value="liked"
                onClick={handleLikeClick}
                active={isLiked}
                ref={likeButtonRef}
                className={getIconButtonStyles({
                  isActive: isLiked,
                  isHidden: hideThumbsUp,
                })}
                aria-checked={isLiked}
                role="radio"
              >
                <ThumbsUp />
              </IconButton>
            ) : (
              <RadioButton
                id={`like-${inputName}`}
                aria-label="Like this message"
                name={inputName}
                value="liked"
                onChange={handleChange}
                checked={isLiked}
                className={getHiddenStyles(hideThumbsUp)}
              >
                <ThumbsUp
                  fill={getIconFill({ darkMode, isSelected: isLiked })}
                />
              </RadioButton>
            )}
            {isCompact ? (
              <IconButton
                id={`dislike-${inputName}`}
                aria-label="Dislike this message"
                title="Not helpful"
                value="disliked"
                onClick={handleDislikeClick}
                active={isDisliked}
                ref={dislikeButtonRef}
                className={getIconButtonStyles({
                  isActive: isDisliked,
                  isHidden: hideThumbsDown,
                })}
                aria-checked={isDisliked}
                role="radio"
              >
                <ThumbsDown />
              </IconButton>
            ) : (
              <RadioButton
                id={`dislike-${inputName}`}
                name={inputName}
                value="disliked"
                aria-label="Dislike this message"
                onChange={handleChange}
                checked={isDisliked}
                className={getHiddenStyles(hideThumbsDown)}
              >
                <ThumbsDown
                  fill={getIconFill({ darkMode, isSelected: isDisliked })}
                />
              </RadioButton>
            )}
          </div>
        </div>
      </LeafyGreenProvider>
    );
  }
);

MessageRating.displayName = 'MessageRating';
