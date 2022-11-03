import React, { useMemo } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import type { glyphs } from '@leafygreen-ui/icon';

import { withTheme } from '../../hooks/use-theme';
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
  backgroundColor: palette.gray.dark3,
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
  paddingTop: spacing[2] - 2, // steal space for the border effect
  paddingBottom: spacing[2],
  gridTemplateAreas: `
    'icon namespace'
  `,
  columnGap: spacing[2],
  rowGap: 0,
});

const tabSubtitleStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
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
  darkMode?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  iconGlyph: IconGlyph;
  tabContentId: string;
  subtitle: string;
};

function UnthemedTab({
  darkMode,
  title,
  isSelected,
  onSelect,
  onClose,
  tabContentId,
  iconGlyph,
  subtitle,
}: TabProps) {
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

  return (
    <div
      className={cx(
        tabStyles,
        darkMode ? tabDarkThemeStyles : tabLightThemeStyles,
        {
          [selectedTabStyles]: isSelected,
          [focusedTabStyles]: isFocused,
        }
      )}
      aria-selected={isSelected}
      role="tab"
      // Catch navigation on the active tab when a user tabs through Compass.
      tabIndex={isSelected ? 0 : -1}
      aria-controls={tabContentId}
      data-testid="workspace-tab-button"
      title={`${subtitle} - ${title}`}
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

const Tab = withTheme(UnthemedTab);

export { Tab };
