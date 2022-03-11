import React from 'react';
import {
  css,
  cx,
  spacing,
  uiColors,
  useDefaultAction,
  useFocusState,
  FocusState,
  IconButton,
  Icon,
  mergeProps,
} from '@mongodb-js/compass-components';

const tabStyles = css({
  border: '1px solid transparent',
  transition: 'border-color .16s ease-out',
  borderBottom: 'none',
  borderTopLeftRadius: spacing[1],
  borderTopRightRadius: spacing[1],
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  margin: 0,
  marginLeft: spacing[1],
  padding: 0,
  height: spacing[5] + spacing[3],
  position: 'relative',

  '&:hover': {
    backgroundColor: uiColors.gray.light3,
    borderColor: uiColors.gray.base, // maybe light 1
    cursor: 'pointer',
    transition: 'border-color .16s ease-in',
  },

  // Focus ring
  '&::after': {
    position: 'absolute',
    content: '""',
    pointerEvents: 'none',
    top: -2,
    right: -2,
    bottom: 0,
    left: -2,
    borderTopLeftRadius: spacing[1],
    borderTopRightRadius: spacing[1],
    border: '3px solid transparent',
    borderBottomWidth: 0,
    transition: 'border-color .16s ease-in',
  },
});

const selectedTabStyles = css({
  background: uiColors.white,
  borderColor: uiColors.gray.light1,
  '&:hover': {
    backgroundColor: uiColors.white,
  },
});

const selectedTabBorderCoverStyles = css({
  '&::after': {
    zIndex: 5,
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: uiColors.white,
  },
});

const focusedTabStyles = css({
  '&::after': {
    transitionTimingFunction: 'ease-out',

    borderColor: uiColors.focus,
  },
});

const hiddenStyles = css({
  visibility: 'hidden',
});

const tabIconStyles = css({
  marginLeft: spacing[2],
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
  color: uiColors.gray.dark1,
});

const tabNamespaceStyles = css({
  display: 'inline-block',
  fontWeight: 'bold',
});

const tabNamespaceFocusedStyles = css({
  color: uiColors.focus,
});

const tabNamespaceSelectedStyles = css({
  display: 'inline-block',
  fontWeight: 'bold',
  color: uiColors.green.dark2,
});

const tabCloseStyles = css({
  marginRight: spacing[1],
});

const tabSubtitleStyles = css({
  // color: uiColors.gray.dark1
});

type TabProps = {
  activeSubTabName: string;
  isFocused: boolean;
  isSelected: boolean;
  onTabClicked: () => void;
  onCloseClicked: () => void;
  tabId: string;
  namespace: string;
  isTabListFocused: boolean;
};

const Tab: React.FunctionComponent<TabProps> = ({
  activeSubTabName,
  isFocused,
  isSelected,
  isTabListFocused,
  onTabClicked,
  onCloseClicked,
  // tabIndex,
  tabId,
  namespace,
}) => {
  // const [navigationProps, currentTabbable] =
  //   useKeyboardArrowNavigation<HTMLDivElement>({
  //     itemsCount,useVirtualGridArrowNavigation
  //     colCount,
  //     rowCount,
  //   });
  const defaultActionProps = useDefaultAction(onTabClicked);
  // const [hoverProps, isHovered] = useHoverState();

  const [focusProps, focusState] = useFocusState();

  const tabProps = mergeProps<HTMLDivElement>(focusProps, defaultActionProps);

  const hasFocus = [
    FocusState.FocusVisible,
    FocusState.FocusWithinVisible,
  ].includes(focusState);

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
      {...tabProps}
    >
      <Icon
        className={cx(tabIconStyles, {
          [tabIconSelectedStyles]: isSelected,
          [tabIconFocusedStyles]: isFocused,
        })}
        glyph="Folder"
      />
      <div className={tabTitleContainerStyles}>
        <div
          className={cx(tabNamespaceStyles, {
            [tabNamespaceSelectedStyles]: isSelected,
            [tabNamespaceFocusedStyles]: isFocused,
          })}
        >
          {namespace}
        </div>
        <div className={tabSubtitleStyles}>{activeSubTabName}</div>
      </div>

      <IconButton
        className={cx(
          tabCloseStyles,
          (isSelected && !isTabListFocused) || isFocused
            ? undefined
            : hiddenStyles
        )}
        onClick={(e) => {
          e.stopPropagation();
          onCloseClicked();
        }}
        tabIndex={isSelected || hasFocus ? 0 : -1}
        aria-label="Close Tab"
      >
        <Icon glyph="X" />
      </IconButton>
      {isSelected && <div className={selectedTabBorderCoverStyles} />}
    </div>
  );
};

export { Tab };
