import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import type { glyphs } from '@leafygreen-ui/icon';
import { rgba } from 'polished';

import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { UniqueIdentifier } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useDarkMode } from '../../hooks/use-theme';
import { FocusState, useFocusState } from '../../hooks/use-focus-hover';
import { Icon, IconButton } from '../leafygreen';
import { mergeProps } from '../../utils/merge-props';
import { Tab } from './tab';

export const scrollbarThumbLightTheme = rgba(palette.gray.base, 0.65);
export const scrollbarThumbDarkTheme = rgba(palette.gray.base, 0.65);

const tabsContainerStyles = css({
  margin: 0,
  padding: 0,
  flexShrink: 0, // Don't shrink when the tab contents tries to grow.
  position: 'relative',
  overflow: 'overlay',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid',
  '::-webkit-scrollbar': {
    ':horizontal': {
      height: spacing[1],
    },
  },
});

const tabsContainerLightStyles = css({
  background: palette.white,
  borderBottomColor: palette.gray.light2,
  '::-webkit-scrollbar-thumb': {
    backgroundColor: scrollbarThumbLightTheme,
  },
});

const tabsContainerDarkStyles = css({
  backgroundColor: palette.black,
  borderBottomColor: palette.gray.dark2,
  '::-webkit-scrollbar-thumb': {
    backgroundColor: scrollbarThumbDarkTheme,
  },
});

const tabsListContainerStyles = css({
  padding: 0,
  paddingRight: spacing[4],
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const tabsListStyles = css({
  display: 'inline-flex',
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

function useTabListKeyboardNavigation<HTMLDivElement>({
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
        onSelectTab(nextTabbable);
      }
    },
    [selectedTabIndex, tabsCount, onSelectTab]
  );

  return [{ onKeyDown }];
}

type SortableItemProps = {
  tab: TabProps;
  index: number;
  selectedTabIndex: number;
  activeId: UniqueIdentifier | null;
  onSelect: (tabIndex: number) => void;
  onClose: (tabIndex: number) => void;
};

type SortableListProps = {
  tabs: TabProps[];
  selectedTabIndex: number;
  onMove: (oldTabIndex: number, newTabIndex: number) => void;
  onSelect: (tabIndex: number) => void;
  onClose: (tabIndex: number) => void;
};

type WorkspaceTabsProps = {
  'aria-label': string;
  onCreateNewTab: () => void;
  onSelectTab: (tabIndex: number) => void;
  onCloseTab: (tabIndex: number) => void;
  onMoveTab: (oldTabIndex: number, newTabIndex: number) => void;
  tabs: TabProps[];
  selectedTabIndex: number;
};

export type TabProps = {
  subtitle: string;
  tabContentId: string;
  title: string;
  iconGlyph: Extract<keyof typeof glyphs, string>;
};

export function useRovingTabIndex<T extends HTMLElement = HTMLElement>({
  currentTabbable,
}: {
  currentTabbable: number;
}): React.HTMLProps<T> {
  const rootNode = useRef<T | null>(null);
  const [focusProps, focusState] = useFocusState();

  const focusTabbable = useCallback(() => {
    const selector = `[role="tab"]:nth-child(${
      currentTabbable + 1 /* nth child starts at 1. */
    })`;
    rootNode.current?.querySelector<T>(selector)?.focus();
  }, [rootNode, currentTabbable]);

  useEffect(() => {
    if (
      [
        FocusState.Focus,
        FocusState.FocusVisible,
        FocusState.FocusWithin,
        FocusState.FocusWithinVisible,
      ].includes(focusState)
    ) {
      focusTabbable();
    }
  }, [focusState, focusTabbable]);

  return { ref: rootNode, ...focusProps };
}

const SortableList = ({
  tabs,
  onMove,
  onSelect,
  selectedTabIndex,
  onClose,
}: SortableListProps) => {
  const items = tabs.map((tab) => tab.tabContentId);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating.
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement.
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const onSortEnd = useCallback(
    ({ oldIndex, newIndex }) => {
      const from = tabs.findIndex((tab) => tab.tabContentId === oldIndex);
      const to = tabs.findIndex((tab) => tab.tabContentId === newIndex);
      onMove(from, to);
    },
    [onMove, tabs]
  );

  return (
    <DndContext
      sensors={sensors}
      autoScroll={false}
      onDragStart={({ active }) => {
        if (!active) {
          return;
        }

        setActiveId(active.id);
      }}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        if (over && active.id !== over.id) {
          onSortEnd({ oldIndex: active.id, newIndex: over.id });
        }
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        <div className={sortableItemContainerStyles}>
          {tabs.map((tab: TabProps, index: number) => (
            <SortableItem
              key={`tab-${tab.tabContentId}-${tab.subtitle}`}
              index={index}
              tab={tab}
              activeId={activeId}
              onSelect={onSelect}
              onClose={onClose}
              selectedTabIndex={selectedTabIndex}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

const SortableItem = ({
  tab: { tabContentId, iconGlyph, subtitle, title },
  index,
  selectedTabIndex,
  activeId,
  onSelect,
  onClose,
}: SortableItemProps) => {
  const onTabSelected = useCallback(() => {
    onSelect(index);
  }, [onSelect, index]);

  const onTabClosed = useCallback(() => {
    onClose(index);
  }, [onClose, index]);

  const isSelected = useMemo(
    () => selectedTabIndex === index,
    [selectedTabIndex, index]
  );

  const isDragging = useMemo(
    () => tabContentId === activeId,
    [tabContentId, activeId]
  );

  return (
    <Tab
      title={title}
      isSelected={isSelected}
      isDragging={isDragging}
      iconGlyph={iconGlyph}
      tabContentId={tabContentId}
      subtitle={subtitle}
      onSelect={onTabSelected}
      onClose={onTabClosed}
    />
  );
};

function WorkspaceTabs({
  ['aria-label']: ariaLabel,
  onCreateNewTab,
  onCloseTab,
  onMoveTab,
  onSelectTab,
  tabs,
  selectedTabIndex,
}: WorkspaceTabsProps) {
  const darkMode = useDarkMode();
  const rovingFocusProps = useRovingTabIndex<HTMLDivElement>({
    currentTabbable: selectedTabIndex,
  });
  const [navigationProps] = useTabListKeyboardNavigation<HTMLDivElement>({
    selectedTabIndex,
    onSelectTab,
    tabsCount: tabs.length,
  });

  const tabContainerProps = mergeProps<HTMLDivElement>(
    rovingFocusProps,
    navigationProps
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
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          {...tabContainerProps}
        >
          <SortableList
            tabs={tabs}
            onMove={onMoveTab}
            onSelect={onSelectTab}
            onClose={onCloseTab}
            selectedTabIndex={selectedTabIndex}
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

export { WorkspaceTabs };
