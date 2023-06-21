import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useHoverState } from '../hooks/use-focus-hover';
import { Button, Icon, IconButton, Link } from './leafygreen';
import { InteractivePopover } from './interactive-popover';
import { mergeProps } from '../utils/merge-props';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../hooks/use-theme';
import { spacing } from '@leafygreen-ui/tokens';
import { GuideCue } from './guide-cue/guide-cue';

export type Signal = {
  /**
   * Unique signal id that will be used to resolve the dismissing logic.
   * If signal was dismissed before and should stay dismissed, it will
   * not be rendered when passed to the component
   */
  id: string;

  title: React.ReactNode;

  description: React.ReactNode;

  learnMoreLink: string;

  /**
   * Optional, default is "Learn more"
   */
  learnMoreLabel?: string;

  /**
   * Optional, will render a primary action button for a signal when provided
   */
  primaryActionButtonLabel?: string;

  primaryActionButtonIcon?: string;

  primaryActionButtonVariant?: 'primaryOutline' | 'dangerOutline';

  /**
   * Optional, when provided the primary action button will behave as a link.
   */
  primaryActionButtonLink?: string;

  /**
   * Optional, when provided will be called with a signal id on primary action
   * button click
   */
  onPrimaryActionButtonClick?: React.MouseEventHandler;
};

type SignalPopoverProps = {
  /** List of signals to render */
  signals: Signal | Signal[];
  darkMode?: boolean;
  onPopoverOpenChange?: (open: boolean) => void;
};

const signalCardContentStyles = css({
  '--signalCardBackgroundColor': palette.white,
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto 1fr auto',
  paddingTop: spacing[4],
  paddingBottom: spacing[4],
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
  backgroundColor: 'var(--signalCardBackgroundColor)',
});

const signalCardContentDarkModeStyles = css({
  '--signalCardBackgroundColor': palette.gray.dark4,
});

const signalCardTitleStyles = css({
  maxWidth: '90%',
  marginBottom: spacing[2],
  fontSize: spacing[3],
});

const signalCardDescriptionStyles = css({
  marginBottom: spacing[3],
});

const signalCardActionGroupStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
});

const signalCardActionButtonStyles = css({
  flex: 'none',
});

const signalCardLearnMoreLinkStyles = css({
  flex: 'none',
});

const SignalCard: React.FunctionComponent<
  Signal & Pick<SignalPopoverProps, 'darkMode'>
> = ({
  id,
  title,
  description,
  learnMoreLink,
  learnMoreLabel,
  primaryActionButtonLabel,
  primaryActionButtonIcon,
  primaryActionButtonVariant,
  primaryActionButtonLink,
  darkMode: _darkMode,
  onPrimaryActionButtonClick,
}) => {
  const darkMode = useDarkMode(_darkMode);

  return (
    <div
      className={cx(
        signalCardContentStyles,
        darkMode && signalCardContentDarkModeStyles
      )}
      data-testid="insight-signal-card"
      data-signal-id={id}
    >
      <strong className={signalCardTitleStyles}>{title}</strong>
      <div className={signalCardDescriptionStyles}>{description}</div>
      <div className={signalCardActionGroupStyles}>
        {primaryActionButtonLabel && (
          <Button
            as={primaryActionButtonLink ? 'a' : 'button'}
            target={primaryActionButtonLink ? '_blank' : undefined}
            href={primaryActionButtonLink}
            data-testid="insight-signal-primary-action"
            variant={primaryActionButtonVariant ?? 'primaryOutline'}
            className={signalCardActionButtonStyles}
            leftGlyph={
              primaryActionButtonIcon ? (
                <Icon glyph={primaryActionButtonIcon}></Icon>
              ) : undefined
            }
            onClick={onPrimaryActionButtonClick}
          >
            {primaryActionButtonLabel}
          </Button>
        )}
        <Link
          data-testid="insight-signal-link"
          className={signalCardLearnMoreLinkStyles}
          href={learnMoreLink}
          target="_blank"
        >
          {learnMoreLabel ?? 'Learn more'}
        </Link>
      </div>
    </div>
  );
};

const multiSignalHeaderContainerStyles = css({
  '--multiSignalHeaderBorderColor': palette.gray.light2,
  '--multiSignalHeaderBackgroundColor': palette.gray.light3,
  display: 'flex',
  alignItems: 'center',
  paddingTop: spacing[1],
  paddingBottom: spacing[1],
  paddingLeft: spacing[2],
  paddingRight: spacing[4],
  gap: spacing[1],
  backgroundColor: 'var(--multiSignalHeaderBackgroundColor)',
  boxShadow: `inset 0 -1px 0 var(--multiSignalHeaderBorderColor)`,
  fontVariantNumeric: 'tabular-nums',
});

const multiSignalHeaderContainerDarkModeStyles = css({
  '--multiSignalHeaderBorderColor': palette.gray.dark2,
  '--multiSignalHeaderBackgroundColor': palette.gray.dark3,
});

const MultiSignalHeader: React.FunctionComponent<{
  currentIndex: number;
  total: number;
  onIndexChange(newVal: number): void;
  darkMode?: boolean;
}> = ({ currentIndex, total, onIndexChange, darkMode: _darkMode }) => {
  const darkMode = useDarkMode(_darkMode);
  return (
    <div
      className={cx(
        multiSignalHeaderContainerStyles,
        darkMode && multiSignalHeaderContainerDarkModeStyles
      )}
    >
      <IconButton
        data-testid="insight-signal-show-prev-button"
        aria-label="Show previous insight"
        title="Show previous insight"
        onClick={(e) => {
          e.stopPropagation();
          onIndexChange(currentIndex - 1);
        }}
        disabled={currentIndex === 0}
      >
        <Icon glyph="ChevronLeft"></Icon>
      </IconButton>
      <span>
        Insight <strong>{currentIndex + 1}</strong> of <strong>{total}</strong>
      </span>
      <IconButton
        data-testid="insight-signal-show-next-button"
        aria-label="Show next insight"
        title="Show next insight"
        onClick={(e) => {
          e.stopPropagation();
          onIndexChange(currentIndex + 1);
        }}
        disabled={currentIndex === total - 1}
      >
        <Icon glyph="ChevronRight"></Icon>
      </IconButton>
    </div>
  );
};

const popoverStyles = css({
  width: 315,
});

const popoverHiddenStyles = css({
  display: 'none !important',
  opacity: '0 !important',
  transition: 'none !important',
});

const popoverContentContainerStyles = css({
  display: 'block',
});

const transitionStyles = css({
  transitionProperty:
    'opacity, width, border-radius, color, box-shadow, background-color',
  transitionTimingFunction: 'linear',
  transitionDuration: '0.15s',
});

const badgeStyles = css(
  {
    // button reset first
    padding: 0,
    border: 'none',
    background: 'none',
  },
  {
    position: 'relative',
    display: 'block',
    width: 18,
    height: 18,
    color: 'var(--badgeColor)',
    backgroundColor: 'var(--badgeBackgroundColor)',
    boxShadow: `inset 0 0 0 1px var(--badgeBorderColor)`,
    borderRadius: '9px',
    fontSize: '12px',
    lineHeight: '14px',
    fontWeight: 700,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  transitionStyles
);

const badgeLightModeStyles = css({
  '--badgeBackgroundColor': palette.blue.light3,
  '--badgeBorderColor': palette.blue.light2,
  '--badgeColor': palette.blue.dark1,
});

const badgeDarkModeStyles = css({
  '--badgeBackgroundColor': palette.blue.dark2,
  '--badgeBorderColor': palette.blue.dark1,
  '--badgeColor': palette.blue.light2,
});

const badgeHoveredStyles = css({
  borderRadius: 5,
});

const badgeHoveredLightModeStyles = css({
  '--badgeBackgroundColor': palette.blue.light1,
  '--badgeBorderColor': palette.blue.dark1,
  '--badgeColor': palette.white,
  borderRadius: 5,
});

const badgeHoveredDarkModeStyles = css({
  '--badgeBackgroundColor': palette.blue.dark1,
  '--badgeBorderColor': palette.blue.base,
  '--badgeColor': palette.blue.light3,
});

const badgeIconStyles = css({});

const badgeIconCollapsedStyles = css(
  {
    position: 'absolute',
    top: 2,
    left: 2,
  },
  transitionStyles
);

const badgeLabelStyles = css(
  {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
    top: 2,
  },
  transitionStyles
);

const singleInsightBadge = css({
  justifyContent: 'flex-start',
  paddingLeft: 2,
});

const closeButtonStyles = css({
  // No other way to correctly align this button with the content
  top: 18,
  right: 18,
});

const closeButtonMultiSignalStyles = css({
  top: 5,
  right: 5,
});

const SignalPopover: React.FunctionComponent<SignalPopoverProps> = ({
  signals: _signals,
  darkMode: _darkMode,
  onPopoverOpenChange: _onPopoverOpenChange,
}) => {
  const [cueOpen, setCueOpen] = useState(false);
  const darkMode = useDarkMode(_darkMode);
  const [triggerVisible, setTriggerVisible] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [hoverProps, isHovered] = useHoverState();
  const [currentSignalIndex, setCurrentSignalIndex] = useState(0);
  const signals = Array.isArray(_signals) ? _signals : [_signals];
  const currentSignal = signals[currentSignalIndex];
  const multiSignals = signals.length > 1;
  const isActive = cueOpen || isHovered || popoverOpen;

  const triggerRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!triggerRef.current) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries[0].isIntersecting;
      setTriggerVisible(isVisible);
      // Close popover if trigger is not visible on the screen anymore
      if (!isVisible) {
        setPopoverOpen(false);
      }
    });
    observer.observe(triggerRef.current);
    return observer.disconnect.bind(observer);
  }, []);

  const onPopoverOpenChange = useCallback(
    (newStatus: boolean) => {
      setPopoverOpen(newStatus);
      _onPopoverOpenChange?.(newStatus);
      // Reset current signal index when popover is being opened. If we do this on
      // close instead, the popover content is weirdly changed while the closing
      // animation is happening
      if (newStatus === true) {
        setCurrentSignalIndex(0);
      }
    },
    [_onPopoverOpenChange]
  );

  const badgeLabel = multiSignals ? (
    <>{signals.length}&nbsp;insights</>
  ) : (
    <>
      {/* It's easier to have this icon in two places to account for animations */}
      {/* even though it's the same icon in the collapsed and expanded state    */}
      <Icon glyph="Bulb" size="small"></Icon>
      &nbsp;insight
    </>
  );

  const activeBadgeWidth = multiSignals
    ? // For multiple, the active width of the container is just the width of
      // the label
      `${`${signals.length} insights`.length}ch`
    : // For single, it's icon size plus space and label
      `calc(14px + ${' insight'.length}ch)`;

  return (
    <InteractivePopover
      className={cx(
        popoverStyles,
        // If trigger is not visible, we are in this weird state where trigger
        // component is hidden by something, but the popover might still be on
        // the screen. We already started closing popover, but because
        // leafygreen provides animations that you can't disable, this means
        // that the popover dissapearance can't be correctly animated in this
        // case and so we just hide it with styles
        !triggerVisible && popoverHiddenStyles
      )}
      containerClassName={cx(popoverContentContainerStyles)}
      closeButtonClassName={
        multiSignals ? closeButtonMultiSignalStyles : closeButtonStyles
      }
      open={popoverOpen}
      setOpen={onPopoverOpenChange}
      spacing={spacing[2]}
      trigger={({ children, ...triggerProps }) => {
        const onTriggerClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation();
          triggerProps.onClick(evt);
        };
        return (
          <GuideCue<HTMLButtonElement>
            cueId="insights"
            title="Introducing insights"
            description="Across Compass, you may now see icons like this to clue you in on potential areas of improvement for your data."
            buttonText="See insights in action"
            onPrimaryButtonClick={() => {
              triggerRef.current?.click();
            }}
            // So that the insight badge can animate without messing the tooltip
            // position
            tooltipAlign="right"
            onOpenChange={setCueOpen}
            trigger={({ ref: guideCueRef }) => {
              const props = mergeProps<HTMLButtonElement>(
                hoverProps,
                triggerProps,
                {
                  className: cx(
                    badgeStyles,
                    isActive && badgeHoveredStyles,
                    ...(darkMode
                      ? [
                          badgeDarkModeStyles,
                          isActive && badgeHoveredDarkModeStyles,
                        ]
                      : [
                          badgeLightModeStyles,
                          isActive && badgeHoveredLightModeStyles,
                        ])
                  ),
                  style: { width: isActive ? activeBadgeWidth : 18 },
                  ref: triggerRef,
                },
                { ref: guideCueRef }
              );
              return (
                <>
                  <button
                    {...props}
                    onClick={onTriggerClick}
                    data-testid="insight-badge-button"
                    type="button"
                  >
                    <Icon
                      glyph="Bulb"
                      size="small"
                      className={cx(badgeIconStyles, badgeIconCollapsedStyles)}
                      style={{ opacity: isActive ? 0 : 1 }}
                    ></Icon>
                    <strong
                      className={cx(
                        badgeLabelStyles,
                        !multiSignals && singleInsightBadge
                      )}
                      style={{
                        width: activeBadgeWidth,
                        opacity: isActive ? 1 : 0,
                      }}
                    >
                      {badgeLabel}
                    </strong>
                  </button>
                  {/* Popover needs to be rendered outside of the badge container so */}
                  {/* that hover is not "stuck" when closing popover from  */}
                  {children}
                </>
              );
            }}
          ></GuideCue>
        );
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        onMouseDown={(event) => {
          // Our InteractivePopover makes use of FocusTrap with
          // `clickOutsideDeactivates` set to true. This will let the MouseDown
          // and Click event propagate down to the leaf node in DOM and in certain
          // cases it is undesirable because there might be some functionalities
          // attached for these events on the leaf nodes. Example - Stage List in
          // Aggregation builder where SortableList listens and responds to these
          // events. For that reason we do not let mouse down event propagate out
          // of this card.'
          event.stopPropagation();
        }}
      >
        {multiSignals && (
          <MultiSignalHeader
            currentIndex={currentSignalIndex}
            total={signals.length}
            onIndexChange={setCurrentSignalIndex}
            darkMode={darkMode}
          ></MultiSignalHeader>
        )}
        <SignalCard {...currentSignal} darkMode={darkMode}></SignalCard>
      </div>
    </InteractivePopover>
  );
};

export { SignalPopover };
