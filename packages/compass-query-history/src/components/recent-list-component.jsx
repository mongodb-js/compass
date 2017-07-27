const React = require('react');
const PropTypes = require('prop-types');
const RecentComponent = require('./recent-component');

class RecentListComponent extends React.Component {

  renderZeroState(length) {
    if (length === 0) {
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
    const recents = this.props.recents.filter((recent) => {
      return recent._ns === this.props.ns;
    }).map((item, i) => {
      return (
        <RecentComponent key={i} model={item}/>
      );
    });
    return (
      <div className="query-history-list">
        {this.renderZeroState(recents.length)}
        <ul>
          {recents}
        </ul>
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
