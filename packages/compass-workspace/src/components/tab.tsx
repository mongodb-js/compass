import React, { useMemo } from 'react';
import {
  css,
  cx,
  spacing,
  uiColors,
  useDefaultAction,
  useHoverState,
  IconButton,
  Icon,
  mergeProps,
  compassFontSizes,
  Body,
  withTheme,
} from '@mongodb-js/compass-components';

export type TabType = 'timeseries' | 'view' | 'collection';

const tabStyles = css({
  border: '1px solid',
  borderTop: 'none',
  borderBottom: 'none',
  transition: 'border-color .16s ease-out',
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  margin: 0,
  paddingTop: spacing[2],
  paddingBottom: spacing[1] + spacing[2],
  paddingRight: spacing[1],
  paddingLeft: spacing[3],
  maxWidth: spacing[6] * 3,
  minWidth: spacing[6] * 2,
  position: 'relative',
  color: uiColors.gray.base,

  '&:hover': {
    cursor: 'pointer',
    transition: 'border-color .16s ease-in',
  },

  // Focus ring shown on keyboard focus.
  '&::after': {
    position: 'absolute',
    content: '""',
    pointerEvents: 'none',
    right: -2,
    bottom: 0,
    left: -2,
    border: '3px solid transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    transition: 'border-color .16s ease-in',
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

const focusedTabStyles = css({
  '&::after': {
    transitionTimingFunction: 'ease-out',
    borderColor: uiColors.focus,
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
  paddingBottom: spacing[3] - 1,
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
  marginLeft: spacing[2],
  marginRight: spacing[1],
  display: 'inline-grid',
  gridTemplateColumns: '1fr',
});

const tabTitleStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontWeight: 'bold',
  fontSize: compassFontSizes.smallFontSize,
});

const tabTitleDarkThemeStyles = css({
  color: uiColors.green.dark2,
});

const tabTitleLightThemeStyles = css({
  color: uiColors.gray.base,
});

const tabTitleSelectedDarkThemeStyles = css({
  color: uiColors.green.dark2,
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
  fontSize: compassFontSizes.smallFontSize,
  lineHeight: `${spacing[3]}px`,
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
  activeSubTabName: string;
  darkMode?: boolean;
  isFocused: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  tabId: string;
  namespace: string;
  type: TabType;
  isTabListFocused: boolean;
};

function UnthemedTab({
  darkMode,
  activeSubTabName,
  isFocused,
  isSelected,
  isTabListFocused,
  onSelect,
  onClose,
  tabId,
  type,
  namespace,
}: TabProps) {
  const defaultActionProps = useDefaultAction(onSelect);

  const [hoverProps, isHovered] = useHoverState();

  const tabProps = mergeProps<HTMLDivElement>(hoverProps, defaultActionProps);

  const tabIcon = useMemo(() => {
    return type === 'timeseries'
      ? 'TimeSeries'
      : type === 'view'
      ? 'Visibility'
      : 'Folder';
  }, [type]);

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
      // The tab navigation is handled by the lab list.
      tabIndex={-1}
      aria-controls={tabId}
      title={`${namespace} - ${activeSubTabName}`}
      {...tabProps}
    >
      <Icon
        className={cx(tabIconStyles, {
          [darkMode
            ? tabIconSelectedDarkThemeStyles
            : tabIconSelectedLightThemeStyles]: isSelected,
          [tabIconFocusedStyles]: isFocused,
        })}
        role="presentation"
        glyph={tabIcon}
        size="small"
      />
      <div className={tabTitleContainerStyles}>
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
          {activeSubTabName}
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
          {namespace}
        </Body>
      </div>

      <IconButton
        className={
          // Show theme close button when the tab is hovered or focused.
          (isSelected && isTabListFocused) || isFocused || isHovered
            ? undefined
            : hiddenStyles
        }
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close Tab"
      >
        <Icon glyph="X" role="presentation" />
      </IconButton>
      <div
        role="presentation"
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
