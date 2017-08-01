const React = require('react');
const FontAwesome = require('react-fontawesome');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const QueryComponent = require('./query-component');

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
    const attributes = this.props.model.getAttributes({ props: true });
    Object.keys(attributes)
      .filter(key => key.charAt(0) === '_')
      .forEach(key => delete attributes[key]);
    return (
      <div className="query-history-recent-query">
        <div className="btn-group">
          <button className="btn btn-sm btn-default query-history-button" onClick={this.saveRecent}>
            <FontAwesome name="star-o"/>
          </button>
          <button className="btn btn-sm btn-default query-history-button" onClick={this.copyQuery}>
            <FontAwesome name="clipboard"/>
          </button>
          <button className="btn btn-sm btn-default query-history-button" onClick={this.deleteRecent}>
            <FontAwesome name="trash"/>
          </button>
        </div>
        <QueryComponent
          attributes={attributes}
          title={this.props.model._lastExecuted.toString()}/>
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
