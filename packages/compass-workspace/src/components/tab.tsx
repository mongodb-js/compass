import React from 'react';
import {
  css,
  cx,
  spacing,
  uiColors,
  useDefaultAction,
  useHoverState,
  useFocusState,
  FocusState,
  IconButton,
  Icon,
  mergeProps
} from '@mongodb-js/compass-components';

const tabStyles = css({
  border: '1px solid transparent',
  transition: 'border-color .16s ease-out',
  borderBottom: 'none',
  borderTopLeftRadius: spacing[1],
  borderTopRightRadius: spacing[1],
  display: 'inline-block',
  margin: 0,
  marginLeft: spacing[1],
  // overflow: 'hidden',
  // margin: `0 ${spacing[1]}px`,
  paddingLeft: spacing[2],
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
  paddingRight: spacing[1],
  // alignContent: 'center',
  // alignItems: 'center',

  // display: 'grid',
  // gridTemplateColumns: '1fr 1fr 1fr',

  position: 'relative',

  // '&:active, &:focus': {
  //   // boxShadow: 
  //   backgroundColor: uiColors.gray.light3,
  //   color: 'green',
  //   borderColor: uiColors.gray.dark2
  // },
  '&:hover': {
    backgroundColor: uiColors.gray.light3,
    borderColor: uiColors.gray.base, // maybe light 1
    cursor: 'pointer',
    transition: 'border-color .16s ease-in',
  },

  // Ring on focus.
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
    // boxShadow: `0 0 0 0 ${uiColors.focus}`,
    // transition: 'box-shadow .16s ease-in',
    transition: 'border-color .16s ease-in',
  },
});

const selectedTabStyles = css({
  background: uiColors.white,
  borderColor: uiColors.gray.light1,
  color: uiColors.green.base,
  '&:hover': {
    backgroundColor: uiColors.white
  },

});

const selectedTabBorderCoverStyles = css({
  // overflow: 'visible',
  position: 'relative',

  '&::after': {
    zIndex: 5,
    content: '""',
    position: 'absolute',
    // bottom: '-8px',
    // TODO: Better variables for these
    bottom: -1,
    // marginBottom: '-2px',
    left: -spacing[2],
    right: -spacing[1],
    height: '1px',
    backgroundColor: uiColors.gray.light3
  }
});

const focusedTabStyles = css({
  color: uiColors.focus,
  
  '&::after': {
    // boxShadow: `0 0 0 3px ${uiColors.focus}`,
    transitionTimingFunction: 'ease-out',

    borderColor: uiColors.focus,
    // transition: 'border-color .16s ease-in',

  },
});

const hiddenStyles = css({
  visibility: 'hidden'
});

const tabTitleContainerStyles = css({
  display: 'inline-block',
});

const tabTitleStyles = css({
  marginLeft: spacing[2],
  marginRight: spacing[1],
  display: 'grid',
  gridTemplateColumns: '1fr',
});

const tabNamespaceStyles = css({
  display: 'inline-block',
  fontWeight: 'bold'
})

const tabIconStyles = css({
  gridArea: 'button'
});

const tabSubtitleStyles = css({
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

  const tabProps = mergeProps(
    // hoverProps,
    focusProps,
    defaultActionProps
  );

  // const isB
  // const isButtonVisible

  // const [navigationProps] = useKeyboardNavigation<HTMLDivElement>({
  //   selectedTabIndex,
  //   onSelectTab,
  //   tabsCount: tabs.length
  // });

  const hasFocus = [FocusState.FocusVisible, FocusState.FocusWithinVisible].includes(
    focusState
  );

  return (
    <div
      className={cx(tabStyles, {
        [selectedTabStyles]: isSelected,
        [focusedTabStyles]: isFocused // || // isSelected && (focusState === FocusState.FocusVisible || isFocused)
        // [focusedTabStyles]: (isSelected && isTabListFocused)
      })}
      // type="button"
      // onKeyPress
      // id={tabId}
      aria-selected={isSelected}
      role="tab"
      // The tab navigation is handled by the lab list.
      tabIndex={-1}
      aria-controls={tabId}
      // aria-controls="TODOIdRefOfTabContent"
      {...tabProps}
    >
      <Icon
        className={tabIconStyles}
        glyph="Folder"
      />
      <div className={tabTitleContainerStyles}>
        <div
          className={tabTitleStyles}
        >
          <div className={tabNamespaceStyles}>
            {namespace}
          </div>
          <div>
            {activeSubTabName}
          </div>
        </div>
      </div>
      
      {/* {isButtonVisible ? ( */}
        <IconButton
          className={cx(tabIconStyles, ((isSelected && !isTabListFocused) || isFocused) ? undefined : hiddenStyles)}
          onClick={(e) => {
            e.stopPropagation();
            onCloseClicked();
          }}
          // 
          tabIndex={(isSelected || hasFocus) ? 0 : -1}
          aria-label="Close Tab"
        >
          <Icon
            glyph="X"
          />  
        </IconButton>
       {/* ) : (<div className={} />)} */}
      {isSelected && (
        <div className={selectedTabBorderCoverStyles} />
      )}
    </div>
  );
};

export { Tab };
