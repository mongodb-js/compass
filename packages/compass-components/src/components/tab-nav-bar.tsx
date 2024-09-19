import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';

import { useDarkMode } from '../hooks/use-theme';
import { Tabs, Tab } from './leafygreen';

const containerStyles = css({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  overflow: 'hidden',
});

const tabsContainerStyles = css({
  flex: 'none',
  padding: `0 ${spacing[3]}px`,
});

const tabsContainerDarkStyles = css({
  background: palette.black,
});

const tabsContainerLightStyles = css({
  background: palette.white,
});

const tabStyles = css({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

type TabNavBarProps = {
  'data-testid'?: string;
  'aria-label': string;
  activeTabIndex: number;
  onTabClicked: (tabIndex: number) => void;
  tabs: Array<{
    name: string;
    content: JSX.Element;
    title: JSX.Element;
  }>;
};

/**
 * This component displays tabs with the tab content inside of
 * a container that scrolls when it overflows, while keeping
 * the tabs in the same location.
 */
function TabNavBar({
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
  activeTabIndex,
  onTabClicked,
  tabs,
}: TabNavBarProps): React.ReactElement | null {
  const darkMode = useDarkMode();

  return (
    <div className={containerStyles}>
      <div
        className={cx(
          tabsContainerStyles,
          darkMode ? tabsContainerDarkStyles : tabsContainerLightStyles
        )}
      >
        <Tabs
          data-testid={dataTestId}
          aria-label={ariaLabel}
          className="test-tab-nav-bar-tabs"
          setSelected={onTabClicked}
          selected={activeTabIndex}
        >
          {tabs.map(({ name, title }, idx) => {
            return (
              <Tab
                className="test-tab-nav-bar-tab"
                key={`tab-${idx}`}
                data-testid={`${name}-tab-button`}
                name={title}
              />
            );
          })}
        </Tabs>
      </div>
      {tabs.map(({ name, content }, idx) => {
        if (idx === activeTabIndex) {
          return (
            <div
              className={tabStyles}
              key={`tab-content-${name}`}
              data-testid={`${name.toLowerCase().replace(/ /g, '-')}-content`}
            >
              {content}
            </div>
          );
        }
      })}
    </div>
  );
}

export { TabNavBar };
