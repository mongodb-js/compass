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
  mergeProps
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
  // overflow: 'hidden',
  // margin: `0 ${spacing[1]}px`,
  // paddingLeft: spacing[2],
  // paddingTop: spacing[2],
  // paddingBottom: spacing[2],
  // paddingRight: spacing[1],
  height: spacing[5] + spacing[3],
  // lineHeight: `${spacing[6]}px`,
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
  // color: uiColors.green.base,
  '&:hover': {
    backgroundColor: uiColors.white
  },

});

const selectedTabBorderCoverStyles = css({
  // overflow: 'visible',
  // position: 'relative',

  '&::after': {
    zIndex: 5,
    content: '""',
    position: 'absolute',
    // bottom: '-8px',
    // TODO: Better variables for these
    bottom: 0,
    // marginBottom: '-2px',
    // left: -spacing[2],
    // right: -spacing[1],
    // // // Cover the border as well.
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: uiColors.white
    // backgroundColor: 'purple'
  }
});

const focusedTabStyles = css({
  // color: uiColors.focus,
  
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

const tabIconStyles = css({
  marginLeft: spacing[2]
  // color: uiColors.green.dark2,
  // gridArea: 'button'
  // paddingTop: spacing[1]
  // alignContent: 'normal'
  // margin: 'auto 0'
});

const tabIconSelectedStyles = css({
  color: uiColors.green.dark2,
  // gridArea: 'button'
  // paddingTop: spacing[1]
  // alignContent: 'normal'
  // margin: 'auto 0'
});

const tabIconFocusedStyles = css({
  color: uiColors.focus,
  // gridArea: 'button'
  // paddingTop: spacing[1]
  // alignContent: 'normal'
  // margin: 'auto 0'
});

const tabTitleContainerStyles = css({
  marginLeft: spacing[2],
  marginRight: spacing[1],
  display: 'inline-grid',
  gridTemplateColumns: '1fr',
  color: uiColors.gray.dark1,
});

// const tabTitleStyles = css({
//   display: 'grid',
// });

const tabNamespaceStyles = css({
  display: 'inline-block',
  fontWeight: 'bold',
})

const tabNamespaceFocusedStyles = css({
  color: uiColors.focus
})

const tabNamespaceSelectedStyles = css({
  display: 'inline-block',
  fontWeight: 'bold',
  color: uiColors.green.dark2
})

const tabCloseStyles = css({
  marginRight: spacing[1]

  // gridArea: 'button'
  // color: uiColors.green.dark2
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

  const tabProps = mergeProps<HTMLDivElement>(
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

  // TODO: on select tab by clicking (in the tab), focus
  // the container for key actions.

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
        className={cx(tabIconStyles, {
          [tabIconSelectedStyles]: isSelected,
          [tabIconFocusedStyles]: isFocused // || // isSelected && (focusState === FocusState.FocusVisible || isFocused)
          // [focusedTabStyles]: (isSelected && isTabListFocused)
        })}
        glyph="Folder"
      />
      <div className={tabTitleContainerStyles}>
        {/* <div
          className={tabTitleStyles}
        > */}
          <div className={cx(tabNamespaceStyles, {
            [tabNamespaceSelectedStyles]: isSelected,
            [tabNamespaceFocusedStyles]: isFocused
          })}>
            {namespace}
          </div>
          <div className={tabSubtitleStyles}>
            {activeSubTabName}
          </div>
        {/* </div> */}
      </div>
      
      {/* {isButtonVisible ? ( */}
        <IconButton
          className={cx(tabCloseStyles, ((isSelected && !isTabListFocused) || isFocused) ? undefined : hiddenStyles)}
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
