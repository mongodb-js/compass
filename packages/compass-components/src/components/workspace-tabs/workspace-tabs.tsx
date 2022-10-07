import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import type { glyphs } from '@leafygreen-ui/icon';

import { withTheme } from '../../hooks/use-theme';
import { FocusState, useFocusState } from '../../hooks/use-focus-hover';
import { Icon, IconButton } from '../leafygreen';
import { mergeProps } from '../../utils/merge-props';
import { Tab } from './tab';

export const scrollbarThumbLightTheme = 'rgba(136, 147, 151, 0.65)';
export const scrollbarThumbDarkTheme = 'rgba(136, 147, 151, 0.65)';

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
  background: uiColors.white,
  borderBottomColor: uiColors.gray.light2,
  '::-webkit-scrollbar-thumb': {
    backgroundColor: scrollbarThumbLightTheme,
  },
});

const tabsContainerDarkStyles = css({
  backgroundColor: uiColors.gray.dark3,
  borderBottomColor: uiColors.gray.dark2,
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
  tabIndex: number;
  selectedTabIndex: number;
  onSelect: (tabIndex: number) => void;
  onClose: (tabIndex: number) => void;
};

const SortableItem = SortableElement(
  ({
    tab: { tabContentId, iconGlyph, subtitle, title },
    tabIndex,
    selectedTabIndex,
    onSelect,
    onClose,
  }: SortableItemProps) => {
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

    return (
      <Tab
        title={title}
        isSelected={isSelected}
        iconGlyph={iconGlyph}
        tabContentId={tabContentId}
        subtitle={subtitle}
        onSelect={onTabSelected}
        onClose={onTabClosed}
      />
    );
  }
);

type SortableListProps = {
  tabs: TabProps[];
  selectedTabIndex: number;
  onSelect: (tabIndex: number) => void;
  onClose: (tabIndex: number) => void;
};

const SortableList = SortableContainer(
  ({ tabs, onSelect, onClose, selectedTabIndex }: SortableListProps) => (
    <div className={sortableItemContainerStyles}>
      {tabs.map((tab: TabProps, index: number) => (
        <SortableItem
          key={`tab-${index}-${tab.subtitle}`}
          // `index` is used internally by the SortableContainer hoc,
          // so we pass our own `tabIndex`.
          index={index}
          tabIndex={index}
          tab={tab}
          onSelect={onSelect}
          onClose={onClose}
          selectedTabIndex={selectedTabIndex}
        />
      ))}
    </div>
  )
);

type WorkspaceTabsProps = {
  'aria-label': string;
  darkMode?: boolean;
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

function UnthemedWorkspaceTabs({
  ['aria-label']: ariaLabel,
  darkMode,
  onCreateNewTab,
  onCloseTab,
  onMoveTab,
  onSelectTab,
  tabs,
  selectedTabIndex,
}: WorkspaceTabsProps) {
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
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          {...tabContainerProps}
        >
          <SortableList
            onClose={onCloseTab}
            onSelect={onSelectTab}
            tabs={tabs}
            selectedTabIndex={selectedTabIndex}
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
