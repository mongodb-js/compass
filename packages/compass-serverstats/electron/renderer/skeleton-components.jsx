const React = require('react');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:skeleton');

class TabNavBar extends React.Component {
  render() {
    const tabbedViews = _.map(this.props.views, (view, idx) => {
      return (
        <div className='tab' key={`tab-content-${idx}`}> {view} </div>
      );
    });
    return (
      <div className={`tab-nav-bar tab-nav-bar-is-${this.props.theme}-theme`}>
        <div className="tab-views"> {tabbedViews} </div>
      </div>
    );
  }
}
TabNavBar.propTypes = {
  theme: React.PropTypes.oneOf(['dark', 'light']),
  activeTabIndex: React.PropTypes.number,
  mountAllViews: React.PropTypes.bool,
  tabs: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  views: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
  onTabClicked: React.PropTypes.func
};

class DatabasesView extends React.Component {
  render() {
    return null;
  }
}

class StatusRow extends React.Component {
  render() {
    let className = 'status-row';
    if (this.props.style !== 'default') {
      className += ` status-row-has-${this.props.style}`;
    }
    return (
      <div className={className}>
        {this.props.children}
      </div>
    );
  }
}
StatusRow.propTypes = {
  style: React.PropTypes.oneOf(['default', 'warning', 'error']),
  children: React.PropTypes.node
};
StatusRow.defaultProps = {
  style: 'default'
};

module.exports = {
  DatabasesView: DatabasesView,
  StatusRow: StatusRow,
  TabNavBar: TabNavBar
};

