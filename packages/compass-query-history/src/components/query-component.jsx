const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const _ = require('lodash');

class QueryComponent extends React.Component {
  constructor(props) {
    super(props);
    this.populateQuery = this.populateQuery.bind(this);
  }

  populateQuery() {
    const fullQuery = {filter: {}, project: {}, sort: {}, skip: 0, limit: 0};
    _.merge(fullQuery, this.props.attributes);
    Actions.runQuery(fullQuery);
  }

  /**
   * Render QueryComponent.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const attributes = this.props.attributes;
    return (
      <div className="query-history-card" onClick={this.populateQuery}>
        <div className="query-history-card-title">{this.props.title}</div>
        <ul>
          {Object.keys(attributes).map(function(key, i) {
            return (
              <li key={i}>
                <h className="query-history-card-label">{key}</h>
                <p>{JSON.stringify(attributes[key], null, 0)}</p>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

QueryComponent.propTypes = {
  title: PropTypes.string,
  attributes: PropTypes.object
};

QueryComponent.displayName = 'QueryHistoryQueryComponent';

module.exports = QueryComponent;
