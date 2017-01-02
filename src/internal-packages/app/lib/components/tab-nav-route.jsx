const React = require('react');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:app:tab-nav');

class TabNav extends React.Component {
  constructor(props) {
    super(props);
    const idx = this._findIndex(this.props.tabRoutes, this.props.activeTab);
    this.state = {
      activeTabIndex: idx
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activeTab !== undefined) {
      const idx = this._findIndex(nextProps.tabRoutes, nextProps.activeTab);
      this.setState({
        activeTabIndex: idx
      });
    }
  }
  onTabClicked(idx, evt) {
    evt.preventDefault();
    // only make changes if the tab clicked is different than current active
    if (this.state.activeTabIndex !== idx) {
      this.setState({ activeTabIndex: idx });
      if (this.props.onTabClicked) {
        this.props.onTabClicked(this.props.tabRoutes[idx]);
      }
    }
  }

  /**
   * find index on tabs based activeTab
   * @param {array} tabs list of tabs
   * @param {string} activeTab current active tab
   * @return {number} index of the active or 0
   */
  _findIndex(tabs, activeTab) {
    // TODO @KeyboardTsundoku this could return -1 if activeTab doesn't exist...
    return _.indexOf(tabs, activeTab);
  }

  renderTabs() {
    const listItems = _.map(this.props.tabNames, (tab, idx) => (
      <li onClick={this.onTabClicked.bind(this, idx)}
          id={tab}
          key={`tab-${idx}`}
          data-test-id={`${this.props.tabRoutes[idx]}-tab`}
          className={`tab-nav-bar tab-nav-bar-tab ${idx === this.state.activeTabIndex ?
            'tab-nav-bar-is-selected' : ''}`}>
        <span className="tab-nav-bar tab-nav-bar-link" href="#">{tab}</span>
      </li>
    ));
    return <ul className="tab-nav-bar tab-nav-bar-tabs">{listItems}</ul>;
  }

  /**
   * Render all views, but only make the active view visible. This is done
   * by wrapping all views in their own div, and setting the `hidden` class
   * on all but the active div.
   *
   * @return {React.Element}    div of all views
   */
  renderViews() {
    const tabbedViews = _.map(this.props.views, (view, idx) => {
      return (
        <div
          key={`tab-content-${idx}`}
          data-test-id={`${this.props.tabRoutes[idx]}-content`}
          className={idx === this.state.activeTabIndex ? 'tab' : 'tab hidden'}>
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

  render() {
    return (
      <div className={`tab-nav-bar tab-nav-bar-is-${this.props.theme}-theme`}>
        <div className="tab-nav-bar tab-nav-bar-header">
          {this.renderTabs()}
        </div>
        {this.renderViews()}
      </div>
    );
  }
}

TabNav.propTypes = {
  theme: React.PropTypes.oneOf(['dark', 'light']),
  activeTab: React.PropTypes.string,
  // tab names should be what is to be displayed in the UI
  tabNames: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  // the internal route for the tab
  tabRoutes: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  views: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
  onTabClicked: React.PropTypes.func
};

TabNav.defaultProps = {
  theme: 'light'
};

TabNav.displayName = 'TabNav';

module.exports = TabNav;
