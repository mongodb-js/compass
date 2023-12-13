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

type TabNavBarProps = {
  'data-testid'?: string;
  'aria-label': string;
  activeTabIndex: number;
  tabs: string[];
  views: React.ReactElement[];
  onTabClicked: (tabIndex: number) => void;
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
  tabs,
  views,
  onTabClicked,
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
          setSelected={onTabClicked}
          selected={activeTabIndex}
        >
          {tabs.map((tab) => (
            <Tab key={tab} name={tab} />
          ))}
        </Tabs>
      </div>
      {views}
    </div>
  );
}

export { TabNavBar };
