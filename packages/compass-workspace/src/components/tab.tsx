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
} from '@mongodb-js/compass-components';

export type TabType = 'timeseries' | 'view' | 'collection';

const tabStyles = css({
  border: `1px solid ${uiColors.gray.light2}`,
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
    backgroundColor: uiColors.gray.light3,
    borderColor: uiColors.gray.light1,
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

const selectedTabStyles = css({
  background: uiColors.white,
  color: uiColors.gray.dark1,

  '&:hover': {
    cursor: 'default',
    backgroundColor: uiColors.white,
  },
});

const focusedTabStyles = css({
  color: uiColors.green.dark2,
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
  width: '12px',
  height: 'auto',
  flexShrink: 0,
  paddingBottom: spacing[3] - 1,
});

const tabIconSelectedStyles = css({
  color: uiColors.green.dark2,
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

const tabTitleFocusedStyles = css({
  color: uiColors.focus,
});

const tabTitleSelectedStyles = css({
  display: 'inline-block',
  fontWeight: 'bold',
  color: uiColors.green.dark2,
});

const tabCloseStyles = css({});

const tabSubtitleStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontSize: compassFontSizes.smallFontSize,
  lineHeight: `${spacing[3]}px`,
  color: uiColors.gray.base,
});

// const tabSubtitleLightStyles = css({
//   color: uiColors.gray.base,
// });

// const tabSubtitleDarkStyles = css({
//   color: uiColors.gray.light1,
// });

const tabSubtitleSelectedStyles = css({
  color: `${uiColors.gray.dark1}`,
});

const tabSubtitleFocusedStyles = css({
  // color: uiColors.gray.dark1,
});

type TabProps = {
  activeSubTabName: string;
  isFocused: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  tabId: string;
  namespace: string;
  type: TabType;
  isTabListFocused: boolean;
};

const Tab: React.FunctionComponent<TabProps> = ({
  activeSubTabName,
  isFocused,
  isSelected,
  isTabListFocused,
  onSelect,
  onClose,
  tabId,
  type,
  namespace,
}) => {
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
      className={cx(tabStyles, {
        [selectedTabStyles]: isSelected,
        [focusedTabStyles]: isFocused,
      })}
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
          [tabIconSelectedStyles]: isSelected,
          [tabIconFocusedStyles]: isFocused,
        })}
        role="presentation"
        glyph={tabIcon}
        size="small"
      />
      <div className={tabTitleContainerStyles}>
        <div
          className={cx(tabTitleStyles, {
            [tabTitleSelectedStyles]: isSelected,
            [tabTitleFocusedStyles]: isFocused,
          })}
        >
          {activeSubTabName}
        </div>
        <Body
          className={cx(tabSubtitleStyles, {
            [tabSubtitleSelectedStyles]: isSelected,
            [tabSubtitleFocusedStyles]: isFocused,
          })}
        >
          {namespace}
        </Body>
      </div>

      <IconButton
        className={cx(
          tabCloseStyles,
          (isSelected && isTabListFocused) || isFocused || isHovered
            ? undefined
            : hiddenStyles
        )}
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
};

export { Tab };
