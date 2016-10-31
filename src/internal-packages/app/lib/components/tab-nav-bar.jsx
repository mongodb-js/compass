const React = require('react');
const _ = require('lodash');
const debug = require('debug')('mongodb-compass:rtss:navbar');

class NavBarComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      paused: false,
      activeTabIndex: 0
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

  renderActiveView() {
    debug('renderActiveView', this.state);
    return this.props.views[this.state.activeTabIndex];
  }

  render() {
    return (
      <div className={`tab-nav-bar tab-nav-bar-is-${this.props.theme}-theme`}>
        <header className="tab-nav-bar tab-nav-bar-header">
          {this.renderTabs()}
        </header>
        {this.renderActiveView()}
      </div>
    );
  }
}

NavBarComponent.propTypes = {
  theme: React.PropTypes.oneOf(['dark', 'light']),
  activeTabIndex: React.PropTypes.number,
  tabs: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  views: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
  onTabClicked: React.PropTypes.func
};

NavBarComponent.defaultProps = {
  theme: 'light',
  activeTabIndex: 0
};

NavBarComponent.displayName = 'NavBarComponent';

module.exports = NavBarComponent;
