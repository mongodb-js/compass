/* eslint-disable @typescript-eslint/no-unused-vars */
// A lot of logic to handle the dropdown behavior is abstracted from the SearchInput component.
// This should be replaced in the future with more reusable logic.
// https://jira.mongodb.org/browse/LG-3554
import React, {
  FocusEventHandler,
  FormEventHandler,
  ForwardedRef,
  forwardRef,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import flattenChildren from 'react-keyed-flatten-children';
import TextareaAutosize from 'react-textarea-autosize';
import {
  useLeafyGreenChatContext,
  Variant,
} from '@lg-chat/leafygreen-chat-provider';
import isUndefined from 'lodash/isUndefined';

import { shim_Theme } from '@mongodb-js/compass-components';
import { Badge } from '@mongodb-js/compass-components';
import { shim_hooks } from '@mongodb-js/compass-components';
const {
  useAutoScroll,
  useBackdropClick,
  useControlledValue,
  useDynamicRefs,
  useEventListener,
  useForwardedRef,
  useMergeRefs,
  usePrevious,
} = shim_hooks;
import {
  LeafyGreenProvider,
  shim_useDarkMode,
} from '@mongodb-js/compass-components';
import { shim_lib } from '@mongodb-js/compass-components';
const { getNodeTextContent } = shim_lib;
import { shim_SearchResultsMenu as SearchResultsMenu } from '@mongodb-js/compass-components';
import { breakpoints } from '@mongodb-js/compass-components';

import { setReactTextAreaValue } from '../utils/setReactTextAreaValue';

import {
  actionContainerStyles,
  adornmentContainerStyles,
  getContentWrapperStyles,
  getFormStyles,
  getHotkeyIndicatorStyles,
  getInnerFocusContainerStyles,
  getTextAreaStyles,
  outerFocusContainerStyles,
} from './InputBar.styles';
import { type InputBarProps } from './InputBar.types';
import { InputBarFeedback } from './InputBarFeedback';
import { InputBarSendButton } from './InputBarSendButton';
import { State } from './shared.types';
import { AssistantAvatar } from '@vendor-leafygreen-ui/avatar';

export const InputBar = forwardRef<HTMLFormElement, InputBarProps>(
  (
    {
      badgeText,
      children,
      className,
      darkMode: darkModeProp,
      disabled = false,
      disableSend,
      dropdownFooterSlot,
      dropdownProps,
      errorMessage,
      onMessageSend,
      onSubmit,
      shouldRenderGradient: shouldRenderGradientProp = true,
      shouldRenderHotkeyIndicator = false,
      state,
      textareaProps,
      textareaRef: externalTextareaRef,
      ...rest
    }: InputBarProps,
    forwardedRef: ForwardedRef<HTMLFormElement>
  ) => {
    const { darkMode, theme } = shim_useDarkMode(darkModeProp);
    const { containerWidth, variant } = useLeafyGreenChatContext();
    const isCompact = variant === Variant.Compact;

    // if (
    //   isCompact &&
    //   (shouldRenderHotkeyIndicator || shouldRenderGradientProp || badgeText)
    // ) {
    //   consoleOnce.warn(
    //     `@lg-chat/input-bar: The InputBar component's props 'shouldRenderHotkeyIndicator', 'shouldRenderGradient', and 'badgeText' are only used in the 'spacious' variant. They will not be rendered in the 'compact' variant set by the provider.`
    //   );
    // }

    // if (!isCompact && (errorMessage || state)) {
    //   consoleOnce.warn(
    //     `@lg-chat/input-bar: The InputBar component's props 'errorMessage' and 'state' are only used in the 'compact' variant. They will not be rendered in the 'spacious' variant set by the provider.`
    //   );
    // }

    const formRef = useForwardedRef(forwardedRef, null);
    const focusContainerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = useMergeRefs([
      internalTextareaRef,
      externalTextareaRef,
    ]);
    const promptRefs = useDynamicRefs<HTMLElement>({
      prefix: 'suggested-prompt',
    });
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [isOpen, setOpen] = useState(false);
    const [prevMessageBody, setPrevMessageBody] = useState<string>('');

    // Use controlled value hook to handle both controlled and uncontrolled modes
    const {
      value: messageBody,
      handleChange,
      updateValue,
      isControlled,
    } = useControlledValue<string>(
      textareaProps?.value?.toString(),
      textareaProps?.onChange,
      ''
    );
    const prevState = usePrevious(state);

    // The index of the currently highlighted result option
    const [highlightIndex, setHighlightIndex] = useState<number | undefined>(
      undefined
    );
    const highlightedElementRef = promptRefs(`${highlightIndex}`);
    const [shouldRenderButtonText, setShouldRenderButtonText] =
      useState<boolean>(false);

    const isSendButtonDisabled = disableSend || disabled || messageBody === '';
    const shouldRenderGradient =
      !isCompact && shouldRenderGradientProp && isFocused && !disabled;
    const showHotkeyIndicator =
      !isCompact && shouldRenderHotkeyIndicator && !disabled;
    const withTypeAhead = !isUndefined(children);

    /**
     * Helper function that both counts the number of `SearchResult` descendants
     * and adds the appropriate props to said children
     */
    const processChildren = useCallback(() => {
      // Count results (not just children, since groups are still children)
      let resultsCount = 0;

      const processChild = (
        child: React.ReactNode
      ): JSX.Element | undefined => {
        if (shim_lib.isComponentType(child, 'SuggestedPrompt')) {
          resultsCount += 1;
          const index = resultsCount - 1;

          const textValue = getNodeTextContent(child);

          const onElementClick: MouseEventHandler = (e) => {
            child.props.onClick?.(e); // call the child's onClick handler

            // Update the input value so the submit event has a target.value
            updateValue(textValue, internalTextareaRef);
            // allow the state update to be consumed in submit
            const submitTimeout = setTimeout(() => {
              formRef?.current?.requestSubmit();
              clearTimeout(submitTimeout);
            });
            closeMenu();
          };

          return React.cloneElement(child, {
            ...child.props,
            id: `suggested-prompt-${index}`,
            key: `suggested-prompt-${index}`,
            ref: child.props.ref ?? promptRefs?.(`${index}`),
            highlighted: index === highlightIndex,
            onClick: onElementClick,
          });
        } else if (shim_lib.isComponentType(child, 'SuggestedPrompts')) {
          const nestedChildren = React.Children.map(
            child.props.children,
            processChild
          );

          if (nestedChildren && nestedChildren.length > 0) {
            return React.cloneElement(child, {
              ...child.props,
              children: nestedChildren,
            });
          }
        }
      };

      const flattenedChildren = flattenChildren(children);
      const updatedChildren = flattenedChildren.map(processChild);

      return {
        resultsCount,
        updatedChildren,
      };
    }, [children, promptRefs, highlightIndex, updateValue, formRef]);

    const { updatedChildren, resultsCount } = useMemo(
      () => processChildren(),
      [processChildren]
    );

    useEffect(() => {
      const newState: boolean =
        containerWidth !== undefined && containerWidth >= breakpoints.Mobile;

      if (newState !== shouldRenderButtonText) {
        setShouldRenderButtonText(newState);
      }
    }, [containerWidth, shouldRenderButtonText]);

    type Direction = 'next' | 'prev' | 'first' | 'last';
    const updateHighlight = (direction: Direction) => {
      switch (direction) {
        case 'first': {
          setHighlightIndex(0);
          break;
        }

        case 'last': {
          setHighlightIndex(resultsCount);
          break;
        }

        case 'next': {
          const nextIndex =
            !isUndefined(highlightIndex) && highlightIndex + 1 < resultsCount
              ? highlightIndex + 1
              : 0;
          setHighlightIndex(nextIndex);
          break;
        }

        case 'prev': {
          const nextIndex =
            !isUndefined(highlightIndex) && highlightIndex - 1 >= 0
              ? highlightIndex - 1
              : resultsCount - 1;
          setHighlightIndex(nextIndex);
        }
      }
    };

    const closeMenu = () => {
      setOpen(false);
      setHighlightIndex(undefined);
    };

    const openMenu = () => setOpen(true);

    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
      const isFocusInMenu = menuRef.current?.contains(document.activeElement);
      const isFocusOnTextarea = focusContainerRef.current?.contains(
        document.activeElement
      );
      const isFocusInComponent = isFocusOnTextarea || isFocusInMenu;

      if (isFocusInComponent) {
        switch (e.key) {
          case 'Enter': {
            e.preventDefault();
            if (!isUndefined(highlightIndex)) {
              highlightedElementRef?.current?.click();
            } else {
              if (!e.ctrlKey && !e.shiftKey) {
                formRef.current?.requestSubmit();
              } else if (e.ctrlKey || e.shiftKey) {
                const textArea =
                  internalTextareaRef?.current as HTMLTextAreaElement;

                if (textArea) {
                  // Insert a new line at the cursor position
                  const { selectionStart, selectionEnd } = textArea;
                  const newValue =
                    messageBody?.substring(0, selectionStart) +
                    '\n' +
                    messageBody?.substring(selectionEnd);

                  // Update the textarea value
                  setReactTextAreaValue(textArea, newValue);
                  updateValue(newValue, internalTextareaRef);
                  const changeEvent = new Event('change', { bubbles: true });
                  internalTextareaRef.current?.dispatchEvent(changeEvent);

                  // Position cursor after the inserted newline
                  setTimeout(() => {
                    textArea.selectionStart = selectionStart + 1;
                    textArea.selectionEnd = selectionStart + 1;
                  });
                }
              }
            }
            break;
          }

          case 'Escape': {
            closeMenu();
            internalTextareaRef.current?.focus();
            break;
          }

          case 'ArrowDown': {
            if (withTypeAhead) {
              internalTextareaRef.current?.focus();
              openMenu();
              e.preventDefault(); // Stop page scroll
              if (isUndefined(highlightIndex)) {
                setHighlightIndex(0);
              } else {
                updateHighlight('next');
              }
            }
            break;
          }

          case 'ArrowUp': {
            if (withTypeAhead) {
              internalTextareaRef.current?.focus();
              openMenu();
              e.preventDefault(); // Stop page scroll
              if (isUndefined(highlightIndex)) {
                setHighlightIndex(resultsCount - 1);
              } else {
                updateHighlight('prev');
              }
            }
            break;
          }

          case 'Tab': {
            if (isOpen) {
              closeMenu();
            }
            break;
          }

          default: {
            // eslint-disable-next-line chai-friendly/no-unused-expressions
            textareaProps?.onKeyDown && textareaProps?.onKeyDown?.(e);
            closeMenu();
          }
        }
      }
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
      e.preventDefault();

      if (isSendButtonDisabled) {
        return;
      }

      if (onMessageSend && messageBody) {
        onMessageSend(messageBody, e);
        if (!isControlled) {
          setPrevMessageBody(messageBody);
          updateValue('', internalTextareaRef);
        }
      }

      onSubmit?.(e);
    };

    const handleFocus: FocusEventHandler<HTMLTextAreaElement> = (_) => {
      setIsFocused(true);
      openMenu();
    };

    const handleBlur: FocusEventHandler<HTMLTextAreaElement> = (_) => {
      setIsFocused(false);
    };

    const handleBackdropClick = () => {
      closeMenu();
    };

    useAutoScroll(highlightedElementRef, menuRef, 12);
    useBackdropClick(handleBackdropClick, [focusContainerRef, menuRef], {
      enabled: isOpen && withTypeAhead,
    });

    useEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (!e.repeat && e.key === '/' && internalTextareaRef.current) {
          e.preventDefault();
          e.stopPropagation();
          internalTextareaRef.current.focus();
        }
      },
      {
        enabled: shouldRenderHotkeyIndicator && !isFocused,
      }
    );

    /**
     * When the state has changed to an 'error', we reset the cleared message to
     * the previous message and focus the textarea so the user can retry sending.
     */
    useEffect(() => {
      if (state === prevState || state !== State.Error) {
        return;
      }

      if (!isControlled) {
        updateValue(prevMessageBody, internalTextareaRef);
        setPrevMessageBody('');
      }

      internalTextareaRef.current?.focus();
    }, [state, prevState, isControlled, prevMessageBody, updateValue]);

    return (
      <LeafyGreenProvider darkMode={darkMode}>
        <form
          className={getFormStyles(className)}
          onSubmit={handleSubmit}
          ref={formRef}
          {...rest}
        >
          {isCompact && (
            <InputBarFeedback errorMessage={errorMessage} state={state} />
          )}
          <div className={outerFocusContainerStyles}>
            <div
              className={getInnerFocusContainerStyles({
                disabled,
                isFocused,
                shouldRenderGradient,
              })}
              ref={focusContainerRef}
            >
              <div
                className={getContentWrapperStyles({
                  disabled,
                  isCompact,
                  isFocused,
                  theme,
                })}
              >
                {!isCompact && (
                  <div className={adornmentContainerStyles}>
                    <AssistantAvatar darkMode={darkMode} disabled={disabled} />
                    {badgeText && <Badge variant="blue">{badgeText}</Badge>}
                  </div>
                )}
                <TextareaAutosize
                  aria-keyshortcuts="/"
                  disabled={disabled}
                  maxRows={isCompact ? 14 : 8}
                  placeholder={'Type your message here'}
                  value={messageBody}
                  {...(textareaProps ?? {})}
                  className={getTextAreaStyles({
                    className: textareaProps?.className,
                    isCompact,
                    theme,
                  })}
                  onKeyDown={handleKeyDown}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  ref={textareaRef}
                />
                <div className={actionContainerStyles}>
                  {showHotkeyIndicator && (
                    <div
                      data-testid="lg-chat-hotkey-indicator"
                      className={getHotkeyIndicatorStyles({
                        isFocused,
                        theme,
                      })}
                    >
                      /
                    </div>
                  )}
                  <InputBarSendButton
                    disabled={isSendButtonDisabled}
                    isCompact={isCompact}
                    shouldRenderButtonText={shouldRenderButtonText}
                    state={state}
                  />
                </div>
              </div>
            </div>
          </div>
          {withTypeAhead && (
            <SearchResultsMenu
              open={isOpen}
              refEl={focusContainerRef}
              ref={menuRef}
              footerSlot={dropdownFooterSlot}
              {...dropdownProps}
            >
              {updatedChildren}
            </SearchResultsMenu>
          )}
        </form>
      </LeafyGreenProvider>
    );
  }
);

InputBar.displayName = 'InputBar';
