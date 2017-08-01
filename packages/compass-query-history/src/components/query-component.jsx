const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const _ = require('lodash');
const { format } = require('../models/query');
const Code = require('./code-component');

class QueryComponent extends React.Component {
  constructor(props) {
    super(props);
    this.populateQuery = this.populateQuery.bind(this);
  }

  /**
   * Populate the query bar with the value of this query.
  */
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
                <Code code={format(attributes[key])} language="js" />
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

QueryComponent.displayName = 'QueryComponent';

module.exports = QueryComponent;
