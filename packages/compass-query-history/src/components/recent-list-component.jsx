const React = require('react');
const PropTypes = require('prop-types');

const RecentComponent = require('./recent-component');

// const debug = require('debug')('mongodb-compass:query-history:recent-list-component');

class RecentListComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * Render RecentList component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-recent-list">
        <ul>
          {this.props.recents.map(function(item, i) {
            return (
              <RecentComponent key={i} model={item}/>
            );
          })}
        </ul>
      </div>
    );
  }
}

RecentListComponent.propTypes = {
  recents: PropTypes.object
};

RecentListComponent.defaultProps = {
  recents: null
};

RecentListComponent.displayName = 'QueryHistoryRecentListComponent';

module.exports = RecentListComponent;
