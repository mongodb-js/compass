const React = require('react');
const PropTypes = require('prop-types');

// const debug = require('debug')('mongodb-compass:query-history:list-component');

class RecentComponent extends React.Component {

  /**
   * Render RecentComponent.
   *
   * Contains a Query Model (TBD).
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-recent">
        <p><i>A recent query.</i></p>
      </div>
    );
  }
}

RecentComponent.propTypes = {
  model: PropTypes.object.isRequired
};

RecentComponent.defaultProps = {
  model: null
};

RecentComponent.displayName = 'QueryHistoryRecentComponent';

module.exports = RecentComponent;
