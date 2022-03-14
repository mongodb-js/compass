import React, { useCallback } from 'react';
import {
  FocusState,
  mergeProps,
  useFocusState,
  Icon,
  IconButton,
  css,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';

import { Tab } from './tab';

const tabsContainerStyles = css({
  margin: 0,
  padding: 0,
  outline: 'none',
  flexShrink: 0,  // Don't shrink more than content.
  position: 'relative'
});

const tabsListContainerStyles = css({
  padding: `${spacing[2]}px ${spacing[4]}px`,
  paddingBottom: 0,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  position: 'relative'
});

const tabsListStyles = css({
  display: 'inline-flex',
  outline: 'none',
});

const tabsBottomBorderStyles = css({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '1px',
  backgroundColor: uiColors.gray.light2,
});

const newTabContainerStyles = css({
  display: 'inline-block',
});

const createNewTabButtonStyles = css({
  marginLeft: spacing[2],
  marginRight: spacing[2],
});

function useKeyboardNavigation<HTMLDivElement>({
  tabsCount,
  onSelectTab,
  selectedTabIndex,
}: {
  tabsCount: number;
  onSelectTab: (tabIndex: number) => void;
  selectedTabIndex: number;
}): [React.HTMLProps<HTMLDivElement>] {
  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLDivElement>) => {
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
};

type WorkspaceTabsProps = {
  onCreateNewTab: () => void;
  onSelectTab: (tabIndex: number) => void;
  onCloseTab: (tabIndex: number) => void;
  tabs: TabProps[];
};

// https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-1/tabs.html
const WorkspaceTabs: React.FunctionComponent<WorkspaceTabsProps> = ({
  onCreateNewTab,
  onCloseTab,
  onSelectTab,
  tabs,
}) => {
  const selectedTabIndex = tabs.findIndex((tab) => tab.isActive);
  const [focusProps, focusState] = useFocusState();

  const [navigationProps] = useKeyboardNavigation<HTMLDivElement>({
    selectedTabIndex,
    onSelectTab,
    tabsCount: tabs.length,
  });

  const tabContainerProps = mergeProps<HTMLDivElement>(
    focusProps,
    navigationProps
  );
  const isTabListFocused = focusState === FocusState.FocusVisible;

  return (
    <div className={tabsContainerStyles}>
      <div className={tabsListContainerStyles}>
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
