import React from 'react';
import PropTypes from 'prop-types';
import map from 'lodash.map';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';

/**
 * Represents tabbed navigation with a tabbed header and content.
 */
class TabNavBar extends React.Component {
  /**
   * Instantiate the tab nav bar.
   *
   * @param {Object} props - The props.
   */
  constructor(props) {
    super(props);
    this.state = {
      paused: false,
      activeTabIndex: props.activeTabIndex ? props.activeTabIndex : 0
    };
  }

  /**
   * Handle a tab being clicked.
   *
   * @param {Number} tabIdx - The tab index.
   */
  onTabClicked = (tabIdx) => {
    this.setState({ activeTabIndex: tabIdx });
    if (this.props.onTabClicked) {
      this.props.onTabClicked(tabIdx, this.props.tabs[tabIdx]);
    }
  }


  /**
   * @returns {number} The active tab index, regardless of controlled/uncontrolled.
   */
  getActiveTabIndex() {
    const isControlled = typeof this.props.activeTabIndex === 'number';
    return isControlled ? this.props.activeTabIndex : this.state.activeTabIndex;
  }

  /**
   * Render the tabs.
   *
   * @returns {React.Component} The tabs.
   */
  renderTabs() {
    return (
      <Tabs
        aria-label={this.props['aria-label']}
        className="test-tab-nav-bar-tabs"
        setSelected={this.onTabClicked}
        selected={this.getActiveTabIndex()}
        darkMode={this.props.darkMode}
      >
        {this.props.tabs.map((tab, idx) => (
          <Tab
            className="test-tab-nav-bar-tab"
            key={`tab-${idx}`}
            name={tab}
          />
        ))}
      </Tabs>
    );
  }

  /**
   * Only render the active view, mounting it and unmounting all non-active views.
   *
   * @return {React.Element}    active view
   */
  renderActiveView() {
    return this.props.views[this.getActiveTabIndex()];
  }

  /**
   * Render all views, but only make the active view visible. This is done
   * by wrapping all views in their own div, and setting the `hidden` class
   * on all but the active div.
   *
   * @return {React.Element}    div of all views
   */
  renderViews() {
    const tabbedViews = map(this.props.views, (view, idx) => {
      return (
        <div
          key={`tab-content-${idx}`}
          data-test-id={`${this.props.tabs[idx].toLowerCase().replace(/ /g, '-')}-content`}
          className={idx === this.getActiveTabIndex() ? 'tab' : 'tab hidden'}
        >
          {view}
        </div>
      );
    });

    return (
      <div className="tab-views">
        {tabbedViews}
      </div>
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <LeafyGreenProvider>
        <div className="tab-nav-bar">
          <div className="tab-nav-bar-tabs">
            {this.renderTabs()}
          </div>
          {this.props.mountAllViews ? this.renderViews() : this.renderActiveView()}
        </div>
      </LeafyGreenProvider>
    );
  }
}

TabNavBar.propTypes = {
  'aria-label': PropTypes.string,
  darkMode: PropTypes.bool,
  activeTabIndex: PropTypes.number,
  mountAllViews: PropTypes.bool,
  tabs: PropTypes.arrayOf(PropTypes.string).isRequired,
  views: PropTypes.arrayOf(PropTypes.element).isRequired,
  onTabClicked: PropTypes.func
};

TabNavBar.defaultProps = {
  'aria-label': 'tabs',
  darkMode: false,
  activeTabIndex: 0,
  mountAllViews: true
};

TabNavBar.displayName = 'TabNavBar';

export default TabNavBar;
