import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import { spacing } from '@leafygreen-ui/tokens';

import { gray8 } from '../compass-ui-colors';

type TabNavBarProps = {
  'data-test-id'?: string;
  'aria-label': string;
  activeTabIndex: number;
  mountAllViews?: boolean;
  tabs: string[];
  views: JSX.Element[];
  onTabClicked: (tabIndex: number) => void;
};

const containerStyles = css({
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  overflow: 'auto',
});

const tabsContainerStyles = css({
  padding: `0 ${spacing[3]}px`,
  background: 'white',
});

const tabContentStyles = css({
  height: '100%',
  width: '100%',
  display: 'flex',
  background: gray8,
  overflow: 'auto',
});

const hiddenStyles = css({
  display: 'none',
});

/**
 * This component displays tabs with the tab content inside of
 * a container that scrolls when it overflows, while keeping
 * the tabs in the same location.
 */
const TabNavBar: React.FunctionComponent<TabNavBarProps> = ({
  'data-test-id': dataTestId,
  'aria-label': ariaLabel,
  activeTabIndex,
  mountAllViews,
  tabs,
  views,
  onTabClicked,
}) => {
  return (
    <div className={containerStyles}>
      <div className={tabsContainerStyles}>
        <Tabs
          data-test-id={dataTestId}
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
              className={cx(tabContentStyles, {
                [hiddenStyles]: idx !== activeTabIndex,
              })}
              key={`tab-content-${tabs[idx]}`}
              data-test-id={`${tabs[idx]
                .toLowerCase()
                .replace(/ /g, '-')}-content`}
            >
              {view}
            </div>
          )
      )}
    </div>
  );
};

export { TabNavBar };
