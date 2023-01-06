import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import type { glyphs } from '@leafygreen-ui/icon';
import { rgba } from 'polished';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';

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

const SortableItem = ({
  tab: { tabContentId, iconGlyph, subtitle, title },
  id,
  tabIndex,
  selectedTabIndex,
  onSelect,
  onClose,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id } as any);

  const onTabSelected = useCallback(() => {
    onSelect(tabIndex);
  }, [onSelect, tabIndex]);

  const onTabClosed = useCallback(() => {
    onClose(tabIndex);
  }, [onClose, tabIndex]);

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

type SortableListProps = {
  tabs: TabProps[];
  selectedTabIndex: number;
  onSelect: (tabIndex: number) => void;
  onClose: (tabIndex: number) => void;
};

const SortableList = ({ tabs, onSelect, onClose, selectedTabIndex }: SortableListProps) => (
  <div className={sortableItemContainerStyles}>
    <SortableContext items={tabs.map((tab: TabProps, index: number) => index)}>
      {tabs.map((tab: TabProps, index: number) => (
        <SortableItem
          key={`tab-${index}-${tab.subtitle}`}
          id={index}
          tabIndex={index}
          tab={tab}
          onSelect={onSelect}
          onClose={onClose}
          selectedTabIndex={selectedTabIndex}
        />
      ))}
    </SortableContext>
  </div>
);

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
            onClose={onCloseTab}
            onSelect={onSelectTab}
            tabs={tabs}
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
