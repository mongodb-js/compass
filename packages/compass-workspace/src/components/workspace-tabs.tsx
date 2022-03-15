import React, { useCallback, useRef } from 'react';
import {
  FocusState,
  mergeProps,
  useFocusState,
  Icon,
  IconButton,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

import { Tab } from './tab';
import type { TabType } from './tab';

export function getTabType({
  isTimeSeries,
  isReadonly,
}: {
  isTimeSeries: boolean;
  isReadonly: boolean;
}): TabType {
  if (isTimeSeries) {
    return 'timeseries';
  }
  if (isReadonly) {
    return 'view';
  }
  return 'collection';
}

const tabsContainerStyles = css({
  margin: 0,
  padding: 0,
  outline: 'none',
  flexShrink: 0, // Don't shrink more than content.
  position: 'relative',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
});

const tabsListContainerStyles = css({
  padding: `0 ${spacing[4]}px`,
  paddingBottom: 0,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const tabsListStyles = css({
  display: 'inline-flex',
  outline: 'none',
});

const newTabContainerStyles = css({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center'
});

const createNewTabButtonStyles = css({
  marginLeft: spacing[2],
  marginRight: spacing[2],
});

const sortableItemContainerStyles = css({
  display: 'inline-flex'
});

// These styles are applied while a user is dragging a collection tab.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore The pointerEvents usage shows as undefined although it's valid.
const workspaceTabsSortableCloneStyles = css({
  pointerEvents: 'auto !important',
  cursor: 'grabbing !important',
  zIndex: 50
});

function useKeyboardNavigation<HTMLDivElement>({
  tabsCount,
  onTabSelected,
  selectedTabIndex,
}: {
  tabsCount: number;
  onTabSelected: (tabIndex: number) => void;
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
        evt.preventDefault();
        evt.stopPropagation();
        // Select the first tab.
        nextTabbable = 0;
      }

      if (evt.key === 'End') {
        evt.preventDefault();
        evt.stopPropagation();
        // Select the last tab.
        nextTabbable = tabsCount - 1;
      }

      if (
        nextTabbable !== selectedTabIndex &&
        nextTabbable >= 0 &&
        nextTabbable < tabsCount
      ) {
        onTabSelected(nextTabbable);
      }
    },
    [selectedTabIndex, tabsCount, onTabSelected]
  );

  return [{ onKeyDown }];
}

type TabProps = {
  namespace: string;
  id: string;
  activeSubTabName: string;
  isActive: boolean;
  type: string;
  isTimeSeries: boolean;
  isReadonly: boolean;
};

type WorkspaceTabsProps = {
  onCreateNewTab: () => void;
  onSelectTab: (tabIndex: number) => void;
  onCloseTab: (tabIndex: number) => void;
  onMoveTab: (oldTabIndex: number, newTabIndex: number) => void
  tabs: TabProps[];
};

// https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-1/tabs.html
const WorkspaceTabs: React.FunctionComponent<WorkspaceTabsProps> = ({
  onCreateNewTab,
  onCloseTab,
  onMoveTab,
  onSelectTab,
  tabs,
}) => {
  const selectedTabIndex = tabs.findIndex((tab) => tab.isActive);
  const [focusProps, focusState] = useFocusState();
  const tabContainerRef = useRef<HTMLDivElement>(null);

  const onTabSelected = useCallback(
    (tabIndex: number) => {
      // When a tab is clicked we focus our container so we can
      // handle arrow key movements.
      if (tabContainerRef.current) {
        tabContainerRef.current.focus();
      }

      onSelectTab(tabIndex);
    },
    [tabContainerRef, onSelectTab]
  );

  const [navigationProps] = useKeyboardNavigation<HTMLDivElement>({
    selectedTabIndex,
    onTabSelected,
    tabsCount: tabs.length,
  });

  const tabContainerProps = mergeProps<HTMLDivElement>(
    focusProps,
    navigationProps
  );

  const isTabListFocused = [
    FocusState.FocusVisible,
    FocusState.FocusWithin,
    FocusState.FocusWithinVisible
  ].includes(focusState);

  const SortableItem = SortableElement(({ value: { tab, index: tabIndex } }: {
    value: {
      tab: TabProps;
      index: number;
    }
  }) => (
    <Tab
      activeSubTabName={tab.activeSubTabName}
      isSelected={tab.isActive}
      isFocused={isTabListFocused && tab.isActive}
      tabId={tab.id}
      type={getTabType(tab)}
      namespace={tab.namespace}
      onSelect={() => onTabSelected(tabIndex)}
      onClose={() => onCloseTab(tabIndex)}
      key={tab.id}
      isTabListFocused={isTabListFocused}
    />
  ));

  const SortableList = SortableContainer(({ items }: {
    items: TabProps[]
  }) => (
    <div
      className={sortableItemContainerStyles}
    >
      {items.map(
        (tab: TabProps, index: number) => (
          <SortableItem
            key={`tab-${index}`}
            index={index}
            value={{ tab: tab, index: index }}
          />
        )
      )}
    </div>
  ));

  return (
    <div className={tabsContainerStyles}>
      <div className={tabsListContainerStyles}>
        <div
          className={tabsListStyles}
          role="tablist"
          aria-label="Workspaces"
          aria-orientation="horizontal"
          ref={tabContainerRef}
          // We make the whole list tabbable and manage the keyboard
          // navigation from this tablist.
          tabIndex={0}
          {...tabContainerProps}
        >
          <SortableList
            items={tabs}
            axis="x"
            lockAxis="x"
            lockToContainerEdges
            lockOffset="0%"
            distance={10}
            onSortEnd={({ oldIndex, newIndex }) => {
              onMoveTab(oldIndex, newIndex);
            }}
            helperClass={workspaceTabsSortableCloneStyles}
          />
          {/* {tabs.map((tab, tabIndex) => (
            <Tab
              activeSubTabName={tab.activeSubTabName}
              isSelected={tab.isActive}
              isFocused={isTabListFocused && tab.isActive}
              tabId={tab.id}
              type={getTabType(tab)}
              namespace={tab.namespace}
              onSelect={() => onTabSelected(tabIndex)}
              onClose={() => onCloseTab(tabIndex)}
              key={tab.id}
              isTabListFocused={isTabListFocused}
            />
          ))} */}
        </div>
        <div className={newTabContainerStyles}>
          <IconButton
            className={createNewTabButtonStyles}
            aria-label="Create new tab"
            onClick={onCreateNewTab}
          >
            <Icon role="presentation" glyph="Plus" />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export { WorkspaceTabs };
