const React = require('react');
const PropTypes = require('prop-types');

const RecentComponent = require('./recent-component');

// const debug = require('debug')('mongodb-compass:query-history:recent-list-component');

class RecentListComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  renderZeroState() {
    if (this.props.recents.length === 0) {
      return (
        <div className="query-history-zero-state">
            <div className="query-history-zero-state-title">Run a query to see it saved here! </div>
        </div>
      );
    }
    return null;
  }

  /**
   * Render RecentList component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const filtered = this.props.recents.filter((recent) => {
      return recent._ns === this.props.ns;
    });
    return (
      <div className="query-history-list">
        {this.renderZeroState()}
        {filtered.map(function(item, i) {
          return (
            <RecentComponent key={i} model={item}/>
          );
        })}
      </div>
    );
  }
}

RecentListComponent.propTypes = {
  recents: PropTypes.object,
  ns: PropTypes.string
};

RecentListComponent.defaultProps = {
  recents: null,
  ns: ''
};

RecentListComponent.displayName = 'QueryHistoryRecentListComponent';

module.exports = RecentListComponent;
