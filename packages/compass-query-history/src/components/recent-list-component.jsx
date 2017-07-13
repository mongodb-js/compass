const React = require('react');
const PropTypes = require('prop-types');

const RecentComponent = require('./recent-component');

// const debug = require('debug')('mongodb-compass:query-history:recent-list-component');

class RecentListComponent extends React.Component {

  /**
   * Render RecentList component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-recent-list">
        <h2 className="query-history-title">RecentListComponent</h2>
        <p><i>The query history recent-list.</i></p>
        <ul>
          {this.props.recents.map(function(item){
            return (
              <RecentComponent model={item}/>
            );
          })}
        </ul>
      </div>
    );
  }
}

RecentListComponent.propTypes = {
  recents: PropTypes.array
};

RecentListComponent.defaultProps = {
  recents: []
};

RecentListComponent.displayName = 'QueryHistoryRecentListComponent';

module.exports = RecentListComponent;
