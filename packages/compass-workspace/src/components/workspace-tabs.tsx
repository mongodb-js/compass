import React, { useCallback } from 'react';
import {

  FocusState,
  mergeProps,
  useFocusState,
  Icon,
  IconButton,
  css,
  spacing,
  uiColors
  } from '@mongodb-js/compass-components';


import { Tab } from './tab';

const tabsContainerStyles = css({
  // display: 'inline-flex',
  // flexDirection: 'row',
  margin: 0,
  padding: 0,
  outline: 'none',
  width: '100%',
  // whiteSpace: 'nowrap',
  // overflowX: 'auto',
  // borderBottom: `1px solid ${uiColors.gray.light1}`,
  // wordWrap: ''
});

const tabsListContainerStyles = css({
  padding: `${spacing[2]}px ${spacing[4]}px`,
  paddingBottom: 0,
  paddingTop: spacing[2],
});

const tabsListStyles = css({
  marginRight: spacing[2],
  display: 'inline-block',
  outline: 'none'
});

const tabsBottomBorderStyles = css({
  // overflow: 'visible',
  position: 'relative',
  width: '100%',

  '&::after': {
    content: '""',
    position: 'absolute',
    // bottom: '-8px',
    bottom: 0,
    // marginBottom: '-2px',
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: uiColors.gray.light1
  }
});

const newTabContainerStyles = css({
  // position: 'relative',
  display: 'inline-block',
  // flexDirection: 'column'
  // paddingBottom: spacing[3]
  // height: spacing[5] + spacing[3],
})

const createNewTabButtonStyles = css({
  // paddingTop: spacing[2]
  // paddingBottom: spacing[3]
  // marginBottom: spacing[3]
})

function useKeyboardNavigation<
  HTMLDivElement
>({
  // defaultCurrentTabbable = 0,
  tabsCount,
  onSelectTab,
  selectedTabIndex,
  // focusState
}: {
  // defaultCurrentTabbable: number;
  tabsCount: number;
  onSelectTab: (tabIndex: number) => void;
  selectedTabIndex: number;
  // focusState: FocusState;
}): [React.HTMLProps<HTMLDivElement>] {
  // const rootNode = useRef<HTMLDivElement | null>(null);
  // const [currentTabbable, setCurrentTabbable] = useState(
  //   defaultCurrentTabbable
  // );

  // useEffect(() => {
  //   if (focusState === FocusState.NoFocus) {
  //     setCurrentTabbable(defaultCurrentTabbable);
  //   }
  // }, [focusState, defaultCurrentTabbable]);


  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLDivElement>) => {
      // console.log('ayo',  evt.key, evt.code);

      // tODO: We need to add ids to tabs and focus them
      // when the focus changes (so we can move between extra items in focus)
      // if (evt.key === 'Enter' || evt.code === 'Space') {
      //   // TODO: First tab and activates

      //   evt.preventDefault();
      //   evt.stopPropagation();
      //   // nextTabbable = 0;
      //   onSelectTab(currentTabbable);
      //   return;
      // }

      let nextTabbable = -1;

      if (evt.key === 'ArrowLeft') {
        evt.stopPropagation();
        nextTabbable = selectedTabIndex - 1;
      }

      if (evt.key === 'ArrowRight') {
        evt.stopPropagation();
        nextTabbable = selectedTabIndex + 1;
      }

      if (evt.key === 'Home') {
        // TODO: First tab and activates

        evt.preventDefault();
        evt.stopPropagation();
        nextTabbable = 0;
      }

      if (evt.key === 'End') {
        // TODO: Moves focus to the last tab and activates it.

        evt.preventDefault();
        evt.stopPropagation();
        nextTabbable = tabsCount - 1;
      }



      if (
        nextTabbable !== selectedTabIndex &&
        nextTabbable >= 0 &&
        nextTabbable < tabsCount
      ) {
        // setCurrentTabbable(nextTabbable);
        onSelectTab(nextTabbable);
      }
    },
    [selectedTabIndex, tabsCount, onSelectTab]
  );

  return [{ onKeyDown }];
}

type TabProps = {
  namespace: string;
  id: string;
  activeSubTabName: string;
  isActive: boolean;
}

type WorkspaceTabsProps = {
  onCreateNewTab: () => void;
  onSelectTab: (tabIndex: number) => void;
  onCloseTab: (tabIndex: number) => void;
  tabs: TabProps[]
}

// https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-1/tabs.html
const WorkspaceTabs: React.FunctionComponent<WorkspaceTabsProps> = ({
  onCreateNewTab,
  onCloseTab,
  onSelectTab,
  tabs
}) => {
  const selectedTabIndex = tabs.findIndex(tab => tab.isActive);
  const [focusProps, focusState] = useFocusState();

  const [navigationProps] = useKeyboardNavigation<HTMLDivElement>({
    // defaultCurrentTabbable: selectedTabIndex,
    selectedTabIndex,
    onSelectTab,
    tabsCount: tabs.length,
    // focusState
  });

  // const [focusProps, focusState] = useFocusState();

  // const {
  //   focusState
  // } = navigationProps;


  // const defaultActionProps = useDefaultAction(onTabClicked);

  // console.log('tabs', tabs);

  // const rovingFocusProps = useVirtualRovingTabIndex<HTMLDivElement>({
  //   currentTabbable,
  //   onFocusMove,
  // });

  // tabsCount

  // tabId

  const tabContainerProps = mergeProps<HTMLDivElement>(
    focusProps,
    navigationProps
  );
  const isTabListFocused = focusState === FocusState.FocusVisible;
  // const isTabListFocused = [FocusState.FocusVisible, FocusState.FocusWithinVisible].includes(
  //   focusState
  // );
  return (
    <div
      className={tabsContainerStyles}
    >
      <div
      className={tabsListContainerStyles}
    >
      <div
        className={tabsListStyles}
        role="tablist"
        aria-label="Workspaces"
        aria-orientation="horizontal"
        tabIndex={0}
        {...tabContainerProps}
      >
        {tabs.map((tab, tabIndex) => (
          <Tab
            activeSubTabName={tab.activeSubTabName}
            isSelected={tab.isActive}
            isFocused={isTabListFocused && tab.isActive}
            tabId={tab.id}
            // ref={t}
            namespace={tab.namespace}
            onTabClicked={() => onSelectTab(tabIndex)}
            onCloseClicked={() => onCloseTab(tabIndex)}
            key={tab.id}
            isTabListFocused={isTabListFocused}
          />
        ))}
      </div>
      <div className={newTabContainerStyles}>
        <IconButton
          className={createNewTabButtonStyles}
          aria-label="Create new tab"
          onClick={onCreateNewTab}
        >
          <Icon glyph="Plus" />
        </IconButton>
      </div>
      </div>
      <div className={tabsBottomBorderStyles} />
    </div>
  );
};

export { WorkspaceTabs };
