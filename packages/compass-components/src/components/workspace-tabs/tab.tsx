import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import type { glyphs } from '@leafygreen-ui/icon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';
import { useDarkMode } from '../../hooks/use-theme';
import { Icon, IconButton } from '../leafygreen';
import { mergeProps } from '../../utils/merge-props';
import { useDefaultAction } from '../../hooks/use-default-action';

function focusedChild(className: string) {
  return `&:hover ${className}, &:focus-visible ${className}, &:focus-within:not(:focus) ${className}`;
}

const tabTransition = '.16s ease-in-out';

const tabStyles = css({
  display: 'grid',
  gridTemplateColumns: 'min-content 1fr min-content',
  alignItems: 'center',
  paddingLeft: 12,
  paddingRight: spacing[1],
  gap: spacing[2],

  maxWidth: spacing[6] * 4,
  minWidth: spacing[6] * 2,
  height: 36,
  position: 'relative',
  outline: 'none',

  backgroundColor: 'var(--workspace-tab-background-color)',
  color: 'var(--workspace-tab-color)',
  boxShadow: 'inset -1px -1px 0 0 var(--workspace-tab-border-color)',

  '&:hover': {
    cursor: 'pointer',
    zIndex: 1,
  },

  '&:focus-visible': {
    boxShadow: 'inset 0 0 0 1px var(--workspace-tab-border-color)',
  },

  [focusedChild('.workspace-tab-close-button')]: {
    visibility: 'visible',
  },
});

const animatedSubtitleStyles = css({
  [focusedChild('.workspace-tab-title')]: {
    transform: 'translateY(6px)',
  },

  [focusedChild('.workspace-tab-subtitle')]: {
    opacity: 1,
    transform: 'translateY(-4px)',
    pointerEvents: 'auto',
  },
});

const tabLightThemeStyles = css({
  '--workspace-tab-background-color': palette.gray.light3,
  '--workspace-tab-selected-background-color': palette.white,
  '--workspace-tab-border-color': palette.gray.light2,
  '--workspace-tab-color': palette.gray.base,
  '--workspace-tab-selected-color': palette.green.dark2,
  '&:focus-visible': {
    '--workspace-tab-selected-color': palette.blue.base,
    '--workspace-tab-border-color': palette.blue.base,
  },
});

const tabDarkThemeStyles = css({
  '--workspace-tab-background-color': palette.gray.dark3,
  '--workspace-tab-selected-background-color': palette.black,
  '--workspace-tab-border-color': palette.gray.dark2,
  '--workspace-tab-color': palette.gray.base,
  '--workspace-tab-selected-color': palette.green.base,
  '&:focus-visible': {
    '--workspace-tab-selected-color': palette.blue.light1,
    '--workspace-tab-border-color': palette.blue.light1,
  },
});

const selectedTabStyles = css({
  color: 'var(--workspace-tab-selected-color)',
  backgroundColor: 'var(--workspace-tab-selected-background-color)',
  boxShadow: 'inset -1px 0 0 0 var(--workspace-tab-border-color)',

  '&:hover': {
    cursor: 'default',
  },
});

const draggingTabStyles = css({
  cursor: 'grabbing !important',
});

const tabIconStyles = css({
  color: 'currentColor',
});

const tabTitleContainerStyles = css({
  position: 'relative',
  minWidth: 0,
});

const tabTitleStyles = css({
  fontSize: 12,
  lineHeight: '16px',
  fontWeight: 700,
  color: 'currentColor',

  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',

  transform: 'translateY(0)',
  transition: tabTransition,
  transitionProperty: 'opacity, transform',
});

const tabSubtitleStyles = css({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',

  fontSize: 10,
  lineHeight: '12px',
  color: 'var(--workspace-tab-color)',

  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',

  opacity: 0,
  transform: 'translateY(0)',
  transition: tabTransition,
  transitionProperty: 'opacity, transform',

  pointerEvents: 'none',
});

const closeButtonStyles = css({
  visibility: 'hidden',
});

const selectedCloseButtonStyles = css({
  visibility: 'visible',
});

type IconGlyph = Extract<keyof typeof glyphs, string>;

type TabProps = {
  title: string;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onClose: () => void;
  iconGlyph: IconGlyph;
  tabContentId: string;
  subtitle?: string;
};

function Tab({
  title,
  isSelected,
  isDragging,
  onSelect,
  onClose,
  tabContentId,
  iconGlyph,
  subtitle,
  ...props
}: TabProps & React.HTMLProps<HTMLDivElement>) {
  const darkMode = useDarkMode();
  const defaultActionProps = useDefaultAction(onSelect);
  const { listeners, setNodeRef, transform, transition } = useSortable({
    id: tabContentId,
  });

  const tabProps = mergeProps<HTMLDivElement>(
    defaultActionProps,
    listeners ?? {},
    props
  );

  const style = {
    transform: cssDndKit.Transform.toString(transform),
    transition,
    cursor: 'grabbing !important',
    // For tabs with longer subtitles we want base width to be bigger so that
    // the subtitle that shows up on hover has a bit more space for it
    minWidth: (subtitle?.length ?? 0) > 16 ? spacing[6] * 3 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        tabStyles,
        darkMode ? tabDarkThemeStyles : tabLightThemeStyles,
        isSelected && selectedTabStyles,
        isDragging && draggingTabStyles,
        subtitle && animatedSubtitleStyles
      )}
      aria-selected={isSelected}
      role="tab"
      // Catch navigation on the active tab when a user tabs through Compass.
      tabIndex={isSelected ? 0 : -1}
      aria-controls={tabContentId}
      data-testid="workspace-tab-button"
      title={subtitle ? subtitle : title}
      {...tabProps}
    >
      <Icon
        size="small"
        role="presentation"
        className={tabIconStyles}
        glyph={iconGlyph}
        data-testid={`workspace-tab-icon-${iconGlyph}`}
      />

      <div className={tabTitleContainerStyles}>
        <div className={cx(tabTitleStyles, 'workspace-tab-title')}>{title}</div>
        {subtitle && (
          <div className={cx(tabSubtitleStyles, 'workspace-tab-subtitle')}>
            {subtitle}
          </div>
        )}
      </div>

      <IconButton
        className={cx(
          closeButtonStyles,
          isSelected && selectedCloseButtonStyles,
          'workspace-tab-close-button'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close Tab"
        data-testid="close-workspace-tab"
      >
        <Icon glyph="X" role="presentation" />
      </IconButton>
    </div>
  );
}

export { Tab };
