import React, { useMemo } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import type { glyphs } from '@leafygreen-ui/icon';

import { useSortable } from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';

import { useDarkMode } from '../../hooks/use-theme';
import {
  FocusState,
  useFocusState,
  useHoverState,
} from '../../hooks/use-focus-hover';
import { Icon, IconButton, Body } from '../leafygreen';
import { mergeProps } from '../../utils/merge-props';
import { useDefaultAction } from '../../hooks/use-default-action';

const tabStyles = css({
  border: '1px solid',
  borderTopWidth: 0,
  borderBottomWidth: 0,
  transition: 'border-color .16s ease-out',
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  margin: 0,
  paddingRight: spacing[1],
  paddingLeft: spacing[3],
  maxWidth: spacing[6] * 3,
  minWidth: spacing[6] * 2,
  position: 'relative',
  color: palette.gray.base,
  outline: 'none',

  '&:hover': {
    cursor: 'pointer',
    zIndex: 1, // Show the border over surrounding tabs.
    transition: 'border-color .16s ease-in',
  },
  ':not(:first-child)': {
    marginLeft: '-1px', // Keep the borders only 1px.
  },
});

const tabLightThemeStyles = css({
  background: palette.white,
  borderColor: palette.gray.light2,
  '&:hover': {
    borderColor: palette.gray.light1,
  },
});

const tabDarkThemeStyles = css({
  backgroundColor: palette.black,
  borderColor: palette.gray.dark2,
  '&:hover': {
    borderColor: palette.gray.dark1,
  },
});

const selectedTabStyles = css({
  '&:hover': {
    cursor: 'default',
  },
});

const draggingTabStyles = css({
  cursor: 'grabbing !important',
});

const focusedTabStyles = css({
  zIndex: 3, // Show the border over surrounding tabs.
  borderColor: palette.blue.light1,
  '&::after': {
    position: 'absolute',
    content: '""',
    top: 0,
    right: 0,
    left: 0,
    height: '1px',
    backgroundColor: palette.blue.light1,
  },
});

const tabBottomBorderStyles = css({
  position: 'absolute',
  bottom: 0,
  left: '-1px', // Cover border.
  right: '-1px', // Cover border.
  height: 0,
  backgroundColor: palette.green.dark1,
});

const selectedTabBottomBorderStyles = css({
  height: `${spacing[1]}px`,
  backgroundColor: palette.green.dark1,
  transition: 'height 150ms ease-out',
});

const focusedTabBottomBorderStyles = css({
  height: `${spacing[1]}px`,
  backgroundColor: palette.blue.light1,
  transition: 'height 150ms ease-out',
});

const hiddenStyles = css({
  visibility: 'hidden',
});

const tabIconStyles = css({
  width: spacing[1] + spacing[2],
  height: 'auto',
  flexShrink: 0,
  gridArea: 'icon',
  alignSelf: 'center',
});

const tabIconSelectedLightThemeStyles = css({
  color: palette.green.dark2,
});

const tabIconSelectedDarkThemeStyles = css({
  color: palette.green.light2,
});

const tabIconFocusedStyles = css({
  color: palette.blue.light1,
});

const tabTitleContainerStyles = css({
  marginRight: spacing[1],
  display: 'inline-grid',
  paddingTop: spacing[3] - 2, // steal space for the border effect
  paddingBottom: spacing[3],
  gridTemplateAreas: `
    'icon tabName'
    'empty namespace'
  `,
  columnGap: spacing[2],
  rowGap: 0,
});

const tabTitleStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontWeight: 'bold',
  fontSize: '13px',
  gridArea: 'tabName',
});

const tabTitleDarkThemeStyles = css({
  color: palette.gray.base,
});

const tabTitleLightThemeStyles = css({
  color: palette.gray.base,
});

const tabTitleSelectedDarkThemeStyles = css({
  color: palette.green.base,
});

const tabTitleSelectedLightThemeStyles = css({
  color: palette.green.dark2,
});

const tabTitleFocusedStyles = css({
  color: palette.blue.light1,
});

const tabSubtitleStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontSize: '13px',
  lineHeight: `${spacing[3]}px`,
  gridArea: 'namespace',
});

const tabSubtitleLightThemeStyles = css({
  color: palette.gray.base,
});

const tabSubtitleDarkThemeStyles = css({
  color: palette.gray.light1,
});

const tabSubtitleSelectedLightThemeStyles = css({
  color: palette.gray.dark1,
});

const tabSubtitleSelectedDarkThemeStyles = css({
  color: palette.gray.light2,
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
  subtitle: string;
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
}: TabProps) {
  const darkMode = useDarkMode();

  const [focusProps, focusState] = useFocusState();

  const isFocused = useMemo(
    () => focusState === FocusState.FocusVisible,
    [focusState]
  );
  const isFocusedWithin = useMemo(
    () => focusState === FocusState.FocusWithinVisible,
    [focusState]
  );
  const defaultActionProps = useDefaultAction(onSelect);

  const [hoverProps, isHovered] = useHoverState();

  const tabProps = mergeProps<HTMLDivElement>(
    focusProps,
    hoverProps,
    defaultActionProps
  );

  const { listeners, setNodeRef, transform, transition } = useSortable({
    id: tabContentId,
  });
  const style = {
    transform: cssDndKit.Transform.toString(transform),
    transition,
    cursor: 'grabbing !important',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        tabStyles,
        darkMode ? tabDarkThemeStyles : tabLightThemeStyles,
        {
          [selectedTabStyles]: isSelected,
          [focusedTabStyles]: isFocused,
          [draggingTabStyles]: isDragging,
        }
      )}
      aria-selected={isSelected}
      role="tab"
      // Catch navigation on the active tab when a user tabs through Compass.
      tabIndex={isSelected ? 0 : -1}
      aria-controls={tabContentId}
      data-testid="workspace-tab-button"
      title={`${subtitle} - ${title}`}
      {...listeners}
      {...tabProps}
    >
      <div className={tabTitleContainerStyles}>
        <Icon
          size="small"
          role="presentation"
          className={cx(tabIconStyles, {
            [darkMode
              ? tabIconSelectedDarkThemeStyles
              : tabIconSelectedLightThemeStyles]: isSelected,
            [tabIconFocusedStyles]: isFocused,
          })}
          glyph={iconGlyph}
          data-testid={`workspace-tab-icon-${iconGlyph}`}
        />
        <div
          className={cx(
            tabTitleStyles,
            darkMode ? tabTitleDarkThemeStyles : tabTitleLightThemeStyles,
            {
              [darkMode
                ? tabTitleSelectedDarkThemeStyles
                : tabTitleSelectedLightThemeStyles]: isSelected,
              [tabTitleFocusedStyles]: isFocused,
            }
          )}
        >
          {title}
        </div>
        <Body
          className={cx(
            tabSubtitleStyles,
            darkMode ? tabSubtitleDarkThemeStyles : tabSubtitleLightThemeStyles,
            {
              [darkMode
                ? tabSubtitleSelectedDarkThemeStyles
                : tabSubtitleSelectedLightThemeStyles]: isSelected,
            }
          )}
        >
          {subtitle}
        </Body>
      </div>

      <IconButton
        className={
          isFocusedWithin || isFocused || isHovered ? undefined : hiddenStyles
        }
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close Tab"
        data-testid="close-workspace-tab"
      >
        <Icon glyph="X" role="presentation" />
      </IconButton>
      <div
        className={cx(tabBottomBorderStyles, {
          [selectedTabBottomBorderStyles]: isSelected,
          [focusedTabBottomBorderStyles]: isFocused,
        })}
      />
    </div>
  );
}

export { Tab };
