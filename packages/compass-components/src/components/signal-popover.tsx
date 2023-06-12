import React, { useCallback, useState } from 'react';
import { useHoverState } from '../hooks/use-focus-hover';
import { Button, Icon, IconButton, Link } from './leafygreen';
import { InteractivePopover } from './interactive-popover';
import { mergeProps } from '../utils/merge-props';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../hooks/use-theme';
import { spacing } from '@leafygreen-ui/tokens';

type Signal = {
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
};

type SignalPopoverProps = {
  /**
   * Optional, when provided will be called with a signal id on primary action
   * button click
   */
  onPrimaryAction?: (signalId: string) => void;

  /** List of signals to render */
  signals: Signal | Signal[];

  darkMode?: boolean;
};

const signalCardContentStyles = css({
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto 1fr auto',
  paddingTop: spacing[4],
  paddingBottom: spacing[4],
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
  backgroundColor: palette.white,
});

const signalCardTitleStyles = css({
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
  Signal & Pick<SignalPopoverProps, 'onPrimaryAction'>
> = ({
  id,
  title,
  description,
  learnMoreLink,
  learnMoreLabel,
  primaryActionButtonLabel,
  primaryActionButtonIcon,
  primaryActionButtonVariant,
  onPrimaryAction,
}) => {
  return (
    <div
      className={signalCardContentStyles}
      data-testid="insight-signal-card"
      data-signal-id={id}
    >
      <strong className={signalCardTitleStyles}>{title}</strong>
      <div className={signalCardDescriptionStyles}>{description}</div>
      <div className={signalCardActionGroupStyles}>
        {primaryActionButtonLabel && (
          <Button
            data-testid="insight-signal-primary-action"
            variant={primaryActionButtonVariant ?? 'primaryOutline'}
            className={signalCardActionButtonStyles}
            leftGlyph={
              primaryActionButtonIcon ? (
                <Icon glyph={primaryActionButtonIcon}></Icon>
              ) : undefined
            }
            onClick={() => {
              onPrimaryAction?.(id);
            }}
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

const MultiSignalHeader: React.FunctionComponent<{
  currentIndex: number;
  total: number;
  onIndexChange(newVal: number): void;
}> = ({ currentIndex, total, onIndexChange }) => {
  return (
    <div className={multiSignalHeaderContainerStyles}>
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

const popoverContentContainerStyles = css({
  display: 'block',
});

const transitionStyles = css({
  transitionProperty: 'opacity, width, border-radius',
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
    '--badgeBackgroundColor': palette.blue.light3,
    '--badgeBorderColor': palette.blue.light2,
    '--badgeColor': palette.blue.dark1,
    position: 'relative',
    display: 'inline-block',
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

const badgeDarkModeStyles = css({
  // TODO: https://jira.mongodb.org/browse/COMPASS-6912
  '--badgeBackgroundColor': palette.blue.light3,
  '--badgeBorderColor': palette.blue.light2,
  '--badgeColor': palette.blue.dark1,
});

const badgeHoveredStyles = css({
  '--badgeBackgroundColor': palette.blue.light1,
  '--badgeBorderColor': palette.blue.dark1,
  '--badgeColor': palette.white,
  borderRadius: 5,
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
  onPrimaryAction,
  signals: _signals,
  darkMode: _darkMode,
}) => {
  const darkMode = useDarkMode(_darkMode);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [hoverProps, isHovered] = useHoverState();
  const [currentSignalIndex, setCurrentSignalIndex] = useState(0);
  const signals = Array.isArray(_signals) ? _signals : [_signals];
  const currentSignal = signals[currentSignalIndex];
  const multiSignals = signals.length > 1;
  const isActive = isHovered || popoverOpen;

  const onPopoverOpenChange = useCallback((newStatus: boolean) => {
    setPopoverOpen(newStatus);
    // Reset current signal index when popover is being opened. If we do this on
    // close instead, the popover content is weirdly changed while the closing
    // animation is happening
    if (newStatus === true) {
      setCurrentSignalIndex(0);
    }
  }, []);

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
      className={popoverStyles}
      containerClassName={popoverContentContainerStyles}
      closeButtonClassName={
        multiSignals ? closeButtonMultiSignalStyles : closeButtonStyles
      }
      open={popoverOpen}
      setOpen={onPopoverOpenChange}
      spacing={spacing[2]}
      trigger={({ children, ...triggerProps }) => {
        const props = mergeProps<HTMLButtonElement>(hoverProps, triggerProps, {
          className: cx(
            badgeStyles,
            isActive && badgeHoveredStyles,
            darkMode && badgeDarkModeStyles
          ),
          style: { width: isActive ? activeBadgeWidth : 18 },
        });
        return (
          <>
            <button {...props} data-testid="insight-badge-button" type="button">
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
                style={{ width: activeBadgeWidth, opacity: isActive ? 1 : 0 }}
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
    >
      {multiSignals && (
        <MultiSignalHeader
          currentIndex={currentSignalIndex}
          total={signals.length}
          onIndexChange={setCurrentSignalIndex}
        ></MultiSignalHeader>
      )}
      <SignalCard
        {...currentSignal}
        onPrimaryAction={onPrimaryAction}
      ></SignalCard>
    </InteractivePopover>
  );
};

export { SignalPopover };
