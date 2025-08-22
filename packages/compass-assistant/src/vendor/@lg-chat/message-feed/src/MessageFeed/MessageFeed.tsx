import React, {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useInView } from 'react-intersection-observer';
import {
  useLeafyGreenChatContext,
  Variant,
} from '@lg-chat/leafygreen-chat-provider';

import {
  LeafyGreenProvider,
  shim_useDarkMode,
} from '@mongodb-js/compass-components';

import { ScrollToLatestButton } from '../ScrollToLatestButton';

import { CompactMessageFeed } from './CompactMessageFeed';
import { getWrapperStyles } from './MessageFeed.styles';
import { SpaciousMessageFeed } from './SpaciousMessageFeed';
import { MessageFeedProps } from '.';

export const MessageFeed = forwardRef(
  (
    { children, darkMode: darkModeProp, className, ...rest }: MessageFeedProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const { theme, darkMode } = shim_useDarkMode(darkModeProp);
    const { variant } = useLeafyGreenChatContext();

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [showScrollButton, setShowScrollButton] = useState(false);

    const { ref: topInterceptRef, inView: isTopInView } = useInView({
      initialInView: true,
      root: scrollContainerRef.current,
      threshold: 0,
    });
    const { ref: bottomInterceptRef, inView: isBottomInView } = useInView({
      initialInView: true,
      root: scrollContainerRef.current,
      threshold: 0,
    });

    const isCompact = variant === Variant.Compact;
    const ScrollContainer = isCompact
      ? CompactMessageFeed
      : SpaciousMessageFeed;

    const scrollToLatest = useCallback(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo(
          0,
          scrollContainerRef.current.scrollHeight
        );
      }
    }, []);

    useEffect(() => {
      const scrollElement = scrollContainerRef.current;
      if (!scrollElement) return;

      const isScrolledToEnd = () => {
        if (!scrollContainerRef.current) return true;
        const { scrollHeight, scrollTop, clientHeight } =
          scrollContainerRef.current;
        // Add a small buffer (2px) to account for floating point differences
        return scrollHeight - scrollTop - clientHeight <= 2;
      };

      // Handle scroll events
      const handleScroll = () => {
        // Clear any existing timeout
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }

        // Wait until scroll animation completes This avoids a brief flicker
        // when the user scrolls to the bottom
        const scrollDuration = 100;
        scrollTimerRef.current = setTimeout(() => {
          setShowScrollButton(!isScrolledToEnd());
        }, scrollDuration);
      };

      scrollElement.addEventListener('scroll', handleScroll);

      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }
      };
    }, []);

    useEffect(() => {
      if (!showScrollButton) {
        scrollToLatest();
      }
    }, [children, showScrollButton, scrollToLatest]);

    return (
      <LeafyGreenProvider darkMode={darkMode}>
        <div
          {...rest}
          className={getWrapperStyles({
            className,
            hasBottomShadow: !isBottomInView,
            hasTopShadow: !isTopInView,
            isCompact,
            theme,
          })}
          ref={ref}
        >
          <ScrollContainer ref={scrollContainerRef}>
            {/* Empty span element used to track if container can scroll up */}
            <span ref={topInterceptRef} />
            {children}
            {/* Empty span element used to track if container can scroll down */}
            <span ref={bottomInterceptRef} />
          </ScrollContainer>
          <ScrollToLatestButton
            darkMode={darkMode}
            onClick={scrollToLatest}
            visible={showScrollButton}
          />
        </div>
      </LeafyGreenProvider>
    );
  }
);

MessageFeed.displayName = 'MessageFeed';
