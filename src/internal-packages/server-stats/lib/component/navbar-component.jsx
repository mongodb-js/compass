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
      <li key={`tab-${idx}`} className={`rt-nav__tab ${idx === this.state.activeTabIndex ? 'rt-nav--selected' : ''}`}>
        <a onClick={this.onTabClicked.bind(this, idx)} className="rt-nav__link" href="#">{tab}</a>
      </li>
    ));
    return <ul className="rt-nav__tabs">{listItems}</ul>;
  }

  renderActiveView() {
    debug('renderActiveView', this.state);
    return this.props.views[this.state.activeTabIndex];
  }

  render() {
    return (
      <div>
        <header className="rt-nav">
          {this.renderTabs()}
        </header>
        {this.renderActiveView()}
      </div>
    );
  }
}

NavBarComponent.propTypes = {
  activeTabIndex: React.PropTypes.number,
  tabs: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  views: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
  onTabClicked: React.PropTypes.func
};

NavBarComponent.defaultProps = {
  activeTabIndex: 0
};

NavBarComponent.displayName = 'NavBarComponent';

module.exports = NavBarComponent;
