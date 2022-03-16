import React, { useCallback, useMemo, useRef } from 'react';
import {
  FocusState,
  mergeProps,
  useFocusState,
  Icon,
  IconButton,
  css,
  cx,
  spacing,
  uiColors,
  withTheme,
} from '@mongodb-js/compass-components';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

import { Tab } from './tab';
import type { TabType } from './tab';

export function getTabType(
  isTimeSeries: boolean,
  isReadonly: boolean
): TabType {
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
  flexShrink: 0, // Don't shrink when the tab contents tries to grow.
  position: 'relative',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid',
  '::-webkit-scrollbar': {
    ':horizontal': {
      height: spacing[1],
    },
  },
});

const tabsContainerLightStyles = css({
  background: uiColors.white,
  borderBottomColor: uiColors.gray.light2,
});

const tabsContainerDarkStyles = css({
  backgroundColor: uiColors.gray.dark3,
  borderBottomColor: uiColors.gray.dark2,
});

const tabsListContainerStyles = css({
  padding: 0,
  paddingLeft: spacing[3],
  paddingRight: spacing[4],
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
  alignItems: 'center',
});

const createNewTabButtonStyles = css({
  marginLeft: spacing[2],
  marginRight: spacing[2],
});

const sortableItemContainerStyles = css({
  display: 'inline-flex',
});

// These styles are applied while a user is dragging a collection tab.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error The pointerEvents usage errors ts although it's valid.
const workspaceTabsSortableCloneStyles = css({
  pointerEvents: 'auto !important',
  cursor: 'grabbing !important',
  zIndex: 50,
});

function useTabListKeyboardNavigation<HTMLDivElement>({
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
        tabsCount > 0 &&
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

type SortableItemProps = {
  tab: TabProps;
  tabIndex: number;
  isTabListFocused: boolean;
  onSelect: (tabIndex: number) => void;
  onClose: (tabIndex: number) => void;
};

const SortableItem = SortableElement(
  ({
    tab: {
      activeSubTabName,
      isActive,
      id: tabId,
      namespace,
      isTimeSeries,
      isReadonly,
    },
    tabIndex,
    isTabListFocused,
    onSelect,
    onClose,
  }: SortableItemProps) => {
    const onTabSelected = useCallback(() => {
      onSelect(tabIndex);
    }, [onSelect, tabIndex]);

    const onTabClosed = useCallback(() => {
      onClose(tabIndex);
    }, [onClose, tabIndex]);

    const tabType = useMemo(
      () => getTabType(isTimeSeries, isReadonly),
      [isTimeSeries, isReadonly]
    );

    return (
      <Tab
        activeSubTabName={activeSubTabName}
        isSelected={isActive}
        isFocused={isTabListFocused && isActive}
        tabId={tabId}
        type={tabType}
        namespace={namespace}
        onSelect={onTabSelected}
        onClose={onTabClosed}
        isTabListFocused={isTabListFocused}
      />
    );
  }
);

type SortableListProps = {
  tabs: TabProps[];
  isTabListFocused: boolean;
  onSelect: (tabIndex: number) => void;
  onClose: (tabIndex: number) => void;
};

const SortableList = SortableContainer(
  ({ tabs, isTabListFocused, onSelect, onClose }: SortableListProps) => (
    <div className={sortableItemContainerStyles}>
      {tabs.map((tab: TabProps, index: number) => (
        <SortableItem
          key={`tab-${index}-${tab.namespace}`}
          // `index` is used internally by the SortableContainer hoc,
          // so we pass our own `tabIndex`.
          index={index}
          tabIndex={index}
          tab={tab}
          isTabListFocused={isTabListFocused}
          onSelect={onSelect}
          onClose={onClose}
        />
      ))}
    </div>
  )
);

type TabProps = {
  namespace: string;
  id: string;
  activeSubTabName: string;
  isActive: boolean;
  isTimeSeries: boolean;
  isReadonly: boolean;
};

type WorkspaceTabsProps = {
  darkMode?: boolean;
  onCreateNewTab: () => void;
  onSelectTab: (tabIndex: number) => void;
  onCloseTab: (tabIndex: number) => void;
  onMoveTab: (oldTabIndex: number, newTabIndex: number) => void;
  tabs: TabProps[];
};

function UnthemedWorkspaceTabs({
  darkMode,
  onCreateNewTab,
  onCloseTab,
  onMoveTab,
  onSelectTab,
  tabs,
}: WorkspaceTabsProps) {
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

  const [navigationProps] = useTabListKeyboardNavigation<HTMLDivElement>({
    selectedTabIndex,
    onTabSelected,
    tabsCount: tabs.length,
  });

  const tabContainerProps = mergeProps<HTMLDivElement>(
    focusProps,
    navigationProps
  );

  const isTabListFocused = useMemo(
    () =>
      [
        FocusState.FocusVisible,
        FocusState.FocusWithin,
        FocusState.FocusWithinVisible,
      ].includes(focusState),
    [focusState]
  );

  const onSortEnd = useCallback(
    ({ oldIndex, newIndex }) => {
      onMoveTab(oldIndex, newIndex);
    },
    [onMoveTab]
  );

  return (
    <div
      className={cx(
        tabsContainerStyles,
        darkMode ? tabsContainerDarkStyles : tabsContainerLightStyles
      )}
    >
      <div className={tabsListContainerStyles}>
        <div
          className={tabsListStyles}
          role="tablist"
          aria-label="Workspace Tabs"
          aria-orientation="horizontal"
          ref={tabContainerRef}
          // The list is tabbable and manages the keyboard
          // actions for navigating tabs.
          tabIndex={0}
          {...tabContainerProps}
        >
          <SortableList
            onClose={onCloseTab}
            onSelect={onSelectTab}
            tabs={tabs}
            isTabListFocused={isTabListFocused}
            axis="x"
            lockAxis="x"
            lockToContainerEdges
            lockOffset="0%"
            distance={10}
            onSortEnd={onSortEnd}
            helperClass={workspaceTabsSortableCloneStyles}
          />
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
}

const WorkspaceTabs = withTheme(UnthemedWorkspaceTabs);

export { WorkspaceTabs };
