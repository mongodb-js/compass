const React = require('react');
const _ = require('lodash');
// const debug = require('debug')('mongodb-compass:app:nav-bar');

class NavBarComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      paused: false,
      activeTabIndex: props.activeTabIndex || 0
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activeTabIndex !== undefined) {
      this.setState({
        activeTabIndex: nextProps.activeTabIndex
      });
    }
  }

  onTabClicked(idx, evt) {
    evt.preventDefault();
    this.setState({activeTabIndex: idx});
    if (this.props.onTabClicked) {
      this.props.onTabClicked(idx, this.props.tabs[idx]);
    }
  }

  renderTabs() {
    const listItems = _.map(this.props.tabs, (tab, idx) => (
      <li onClick={this.onTabClicked.bind(this, idx)} key={`tab-${idx}`} className={`tab-nav-bar tab-nav-bar-tab ${idx === this.state.activeTabIndex ? 'tab-nav-bar-is-selected' : ''}`}>
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
    const tabbedViews = _.map(this.props.views, (view, idx) => {
      return (
        <div
          key={`tab-content-${idx}`}
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
        <header className="tab-nav-bar tab-nav-bar-header">
          {this.renderTabs()}
        </header>
        {this.props.mountAllViews ? this.renderViews() : this.renderActiveView()}
      </div>
    );
  }
}

NavBarComponent.propTypes = {
  theme: React.PropTypes.oneOf(['dark', 'light']),
  activeTabIndex: React.PropTypes.number,
  mountAllViews: React.PropTypes.bool,
  tabs: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  views: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
  onTabClicked: React.PropTypes.func
};

NavBarComponent.defaultProps = {
  theme: 'light',
  activeTabIndex: 0,
  mountAllViews: true
};

NavBarComponent.displayName = 'NavBarComponent';

module.exports = NavBarComponent;
