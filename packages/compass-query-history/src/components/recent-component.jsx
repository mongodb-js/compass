const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:query-history:list-component');

class RecentComponent extends React.Component {
  constructor(props) {
    super(props);
    this.saveRecent = this.saveRecent.bind(this);
    this.copyQuery = this.copyQuery.bind(this);
    this.deleteRecent = this.deleteRecent.bind(this);
  }

  saveRecent() {
    Actions.saveRecent(this.props.model);
  }

  copyQuery() {
    Actions.copyQuery(this.props.model);
  }

  deleteRecent() {
    Actions.deleteRecent(this.props.model);
  }

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
        <p><i>A recent query: + {JSON.stringify(this.props.model, null, ' ')}</i></p>
        <ul>
          <li id="SAVE-RECENT">
            <span href="#" onClick={this.saveRecent}>Save Recent</span>
          </li>
          <li id="COPY-RECENT">
            <span href="#" onClick={this.copyQuery}>Copy Recent</span>
          </li>
          <li id="DELETE-RECENT">
            <span href="#" onClick={this.deleteRecent}>Delete Recent</span>
          </li>
        </ul>
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
