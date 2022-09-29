import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { uiColors } from '@leafygreen-ui/palette';
import { withTheme } from '../hooks/use-theme';
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
  background: uiColors.gray.dark3,
});

const tabsContainerLightStyles = css({
  background: uiColors.white,
});

const tabStyles = css({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

const hiddenStyles = css({
  display: 'none',
});

type TabNavBarProps = {
  'data-testid'?: string;
  'aria-label': string;
  activeTabIndex: number;
  mountAllViews?: boolean;
  darkMode?: boolean;
  tabs: string[];
  views: JSX.Element[];
  onTabClicked: (tabIndex: number) => void;
};

/**
 * This component displays tabs with the tab content inside of
 * a container that scrolls when it overflows, while keeping
 * the tabs in the same location.
 */
function UnthemedTabNavBar({
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
  activeTabIndex,
  darkMode,
  mountAllViews,
  tabs,
  views,
  onTabClicked,
}: TabNavBarProps): JSX.Element {
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
          {tabs.map((tab, idx) => (
            <Tab
              className="test-tab-nav-bar-tab"
              key={`tab-${idx}`}
              name={tab}
            />
          ))}
        </Tabs>
      </div>
      {views.map(
        (view, idx) =>
          (mountAllViews || idx === activeTabIndex) && (
            <div
              className={cx({
                [tabStyles]: true,
                [hiddenStyles]: idx !== activeTabIndex,
              })}
              key={`tab-content-${tabs[idx]}`}
              data-testid={`${tabs[idx]
                .toLowerCase()
                .replace(/ /g, '-')}-content`}
            >
              {view}
            </div>
          )
      )}
    </div>
  );
}

const TabNavBar = withTheme(UnthemedTabNavBar);

export { TabNavBar };
