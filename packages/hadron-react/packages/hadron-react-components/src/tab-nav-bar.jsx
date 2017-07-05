const React = require('react');
const PropTypes = require('prop-types');
const map = require('lodash.map');

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
      activeTabIndex: props.activeTabIndex || 0
    };
  }

  /**
   * When the component updates, check if the focus/blur lifecycle methods
   * exist and call them if they do.
   */
  componentDidUpdate() {
    for (let i = 0; i < this.props.views.length; i++) {
      if (this.state.activeTabIndex === i) {
        if (this.props.views[i].onTabFocused) {
          this.props.views[i].onTabFocused();
        }
      } else {
        if (this.props.views[i].onTabBlurred) {
          this.props.views[i].onTabBlurred();
        }
      }
    }
  }

  /**
   * Handle component receiving new props.
   *
   * @param {Object} nextProps - The new props.
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.activeTabIndex !== undefined) {
      this.setState({
        activeTabIndex: nextProps.activeTabIndex
      });
    }
  }

  /**
   * Handle a tab being clicked.
   *
   * @param {Number} idx - The tab index.
   * @param {Event} evt - The event.
   */
  onTabClicked(idx, evt) {
    evt.preventDefault();
    this.setState({ activeTabIndex: idx });
    if (this.props.onTabClicked) {
      this.props.onTabClicked(idx, this.props.tabs[idx]);
    }
  }

  /**
   * Render the tabs.
   *
   * @returns {React.Component} The tabs.
   */
  renderTabs() {
    const listItems = map(this.props.tabs, (tab, idx) => (
      <li onClick={this.onTabClicked.bind(this, idx)}
          id={tab.replace(/ /g, '_')}
          key={`tab-${idx}`}
          data-test-id={`${tab.toLowerCase().replace(/ /g, '-')}-tab`}
          className={`tab-nav-bar tab-nav-bar-tab ${idx === this.state.activeTabIndex ?
            'tab-nav-bar-is-selected' : ''}`}>
        <span className="tab-nav-bar tab-nav-bar-link" href="#">{tab}</span>
      </li>
    ));
    return <ul className="tab-nav-bar tab-nav-bar-tabs">{listItems}</ul>;
  }

  /**
   * Only render the active view, mounting it and unmounting all non-active views.
   *
   * @return {React.Element}    active view
   */
  renderActiveView() {
    return this.props.views[this.state.activeTabIndex];
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

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={`tab-nav-bar tab-nav-bar-is-${this.props.theme}-theme`}>
        <div className="tab-nav-bar tab-nav-bar-header">
          {this.renderTabs()}
        </div>
        {this.props.mountAllViews ? this.renderViews() : this.renderActiveView()}
      </div>
    );
  }
}

TabNavBar.propTypes = {
  theme: PropTypes.oneOf(['dark', 'light']),
  activeTabIndex: PropTypes.number,
  mountAllViews: PropTypes.bool,
  tabs: PropTypes.arrayOf(PropTypes.string).isRequired,
  views: PropTypes.arrayOf(PropTypes.element).isRequired,
  onTabClicked: PropTypes.func
};

TabNavBar.defaultProps = {
  theme: 'light',
  activeTabIndex: 0,
  mountAllViews: true
};

TabNavBar.displayName = 'TabNavBar';

module.exports = TabNavBar;
