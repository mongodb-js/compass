import React, { useMemo } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

import { withTheme } from '../../hooks/use-theme';
import { smallFontSize } from '../../compass-font-sizes';
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
  color: uiColors.gray.base,
  outline: 'none',

  '&:hover': {
    cursor: 'pointer',
    zIndex: 1, // Show the border over surrounding tabs.
    transition: 'border-color .16s ease-in',
  },
  ':not(:first-child)': {
    marginLeft: '-1px', // Keep the borders only 1px.
  },
  '&:focus': {
    zIndex: 3, // Show the border over surrounding tabs.
    borderColor: uiColors.focus,
    '&::after': {
      position: 'absolute',
      content: '""',
      top: 0,
      right: 0,
      left: 0,
      height: '1px',
      backgroundColor: uiColors.focus,
    },
  },
});

const tabLightThemeStyles = css({
  background: uiColors.white,
  borderColor: uiColors.gray.light2,
  '&:hover': {
    borderColor: uiColors.gray.light1,
  },
});

const tabDarkThemeStyles = css({
  backgroundColor: uiColors.gray.dark3,
  borderColor: uiColors.gray.dark2,
  '&:hover': {
    borderColor: uiColors.gray.dark1,
  },
});

const selectedTabStyles = css({
  '&:hover': {
    cursor: 'default',
  },
});

const tabBottomBorderStyles = css({
  position: 'absolute',
  bottom: 0,
  left: '-1px', // Cover border.
  right: '-1px', // Cover border.
  height: 0,
  backgroundColor: uiColors.green.dark1,
});

const selectedTabBottomBorderStyles = css({
  height: `${spacing[1]}px`,
  backgroundColor: uiColors.green.dark1,
  transition: 'height 150ms ease-out',
});

const focusedTabBottomBorderStyles = css({
  height: `${spacing[1]}px`,
  backgroundColor: uiColors.focus,
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
  color: uiColors.green.dark2,
});

const tabIconSelectedDarkThemeStyles = css({
  color: uiColors.green.light2,
});

const tabIconFocusedStyles = css({
  color: uiColors.focus,
});

const tabTitleContainerStyles = css({
  marginRight: spacing[1],
  display: 'inline-grid',
  paddingTop: spacing[2],
  paddingBottom: spacing[1] + spacing[2],
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
  fontSize: smallFontSize,
  gridArea: 'tabName',
});

const tabTitleDarkThemeStyles = css({
  color: uiColors.gray.base,
});

const tabTitleLightThemeStyles = css({
  color: uiColors.gray.base,
});

const tabTitleSelectedDarkThemeStyles = css({
  color: uiColors.green.light2,
});

const tabTitleSelectedLightThemeStyles = css({
  color: uiColors.green.dark2,
});

const tabTitleFocusedStyles = css({
  color: uiColors.focus,
});

const tabSubtitleStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontSize: smallFontSize,
  lineHeight: `${spacing[3]}px`,
  gridArea: 'namespace',
});

const tabSubtitleLightThemeStyles = css({
  color: uiColors.gray.base,
});

const tabSubtitleDarkThemeStyles = css({
  color: uiColors.gray.light1,
});

const tabSubtitleSelectedLightThemeStyles = css({
  color: uiColors.gray.dark1,
});

const tabSubtitleSelectedDarkThemeStyles = css({
  color: uiColors.gray.light2,
});

type TabProps = {
  title: string;
  darkMode?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  renderIcon: (
    iconProps: Partial<React.ComponentProps<typeof Icon>>
  ) => JSX.Element;
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
  renderIcon,
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

  const iconProps: Partial<React.ComponentProps<typeof Icon>> = useMemo(
    () => ({
      size: 'small',
      role: 'presentation',
      className: cx(tabIconStyles, {
        [darkMode
          ? tabIconSelectedDarkThemeStyles
          : tabIconSelectedLightThemeStyles]: isSelected,
        [tabIconFocusedStyles]: isFocused,
      }),
    }),
    [darkMode, isFocused, isSelected]
  );

  return (
    <div
      className={cx(
        tabStyles,
        darkMode ? tabDarkThemeStyles : tabLightThemeStyles,
        {
          [selectedTabStyles]: isSelected,
        }
      )}
      aria-selected={isSelected}
      role="tab"
      // Catch navigation on the active tab when a user tabs through Compass.
      tabIndex={isSelected ? 0 : -1}
      aria-controls={tabContentId}
      title={`${subtitle} - ${title}`}
      {...tabProps}
    >
      <div className={tabTitleContainerStyles}>
        {renderIcon(iconProps)}
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
          isFocusedWithin || isFocused || isHovered || isSelected
            ? undefined
            : hiddenStyles
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
