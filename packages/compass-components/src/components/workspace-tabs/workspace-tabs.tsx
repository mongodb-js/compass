import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import type { glyphs } from '@leafygreen-ui/icon';
import { rgba } from 'polished';

import {
  DndContext,
  DragOverlay,
  closestCorners,
  MouseSensor,
  useSensor,
  useSensors,
  TouchSensor,
 } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';
import type { Active } from '@dnd-kit/core';

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
  backgroundColor: palette.gray.dark3,
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
  id: number;
  tabIndex: number;
  selectedTabIndex: number;
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

  const SortableList = ({
    children,
  }: { children: React.ReactNode }) => {
    const [active, setActive] = useState<Active | null>(null);
    const activeTab = active ? tabs[+active.id] : null;
    const sensors = useSensors(
      useSensor(MouseSensor, {
        // Require the mouse to move by 10 pixels before activating
        activationConstraint: {
          distance: 10,
        },
      }),
      useSensor(TouchSensor, {
        // Press delay of 250ms, with tolerance of 5px of movement
        activationConstraint: {
          delay: 250,
          tolerance: 5,
        },
      })
    );

    const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number, newIndex: number }) => {
      onMoveTab(oldIndex, newIndex);
    };

    console.log('activeTab----------------------');
    console.log(activeTab);
    console.log('----------------------');
  
    return (
      <DndContext
        sensors={sensors}
        autoScroll={false}
        collisionDetection={closestCorners}
        onDragStart={({active}) => {
          setActive(active);
        }}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over?.id) {
            onSortEnd({ oldIndex: +active.id, newIndex: +over.id });
          }
          setActive(null);
        }}
        onDragCancel={() => {
          setActive(null);
        }}
      >
        <SortableContext items={tabs.map((tab) => tab.tabContentId)}>
          <div>{children}</div>
        </SortableContext>
        <DragOverlay>{activeTab ? <SortableItem
            key={`tab-${activeTab.tabContentId}-active`}
            id={+activeTab.tabContentId}
            tabIndex={+activeTab.tabContentId}
            tab={activeTab}
            onSelect={onSelectTab}
            onClose={onCloseTab}
            selectedTabIndex={selectedTabIndex}
          /> : null}</DragOverlay>
      </DndContext>
    );
  };

  const SortableItem = ({
    tab: { tabContentId, iconGlyph, subtitle, title },
    id,
    tabIndex,
    selectedTabIndex,
  }: SortableItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id });
  
    const onTabSelected = useCallback(() => {
      onSelectTab(tabIndex);
    }, [tabIndex]);

    const onTabClosed = useCallback(() => {
      onCloseTab(tabIndex);
    }, [tabIndex]);

    const isSelected = useMemo(
      () => selectedTabIndex === tabIndex,
      [selectedTabIndex, tabIndex]
    );
  
    const style = {
      transform: cssDndKit.Transform.toString(transform),
      transition,
    };
  
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Tab
          title={title}
          isSelected={isSelected}
          iconGlyph={iconGlyph}
          tabContentId={tabContentId}
          subtitle={subtitle}
          onSelect={onTabSelected}
          onClose={onTabClosed}
        />
      </div>
    );
  };

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
          <SortableList>
            <div className={sortableItemContainerStyles}>
              {tabs.map((tab: TabProps, index: number) => (
                <SortableItem
                  key={`tab-${index}-${tab.subtitle}`}
                  id={index}
                  tabIndex={index}
                  tab={tab}
                  onSelect={onSelectTab}
                  onClose={onCloseTab}
                  selectedTabIndex={selectedTabIndex}
                />
              ))}
            </div>
          </SortableList>
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
