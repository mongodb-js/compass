const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const { format } = require('../models/query');
const Code = require('./code-component');

class QueryComponent extends React.Component {

  /**
   * Populate the query bar with the value of this query.
  */
  populateQuery() {
    // @note: Durran/Jessica: Don't default the attributes as the empty
    //   projection will cause the document list to go into readony mode.
    //   We don't allow editing of documents if there is a projection
    //   and there's no need for an empty projection in the query bar
    //   as the default placeholder will not display.
    Actions.runQuery(this.props.attributes);
  }

  /**
   * Render QueryComponent.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const attributes = this.props.attributes;
    return (
      <div className="query-history-card" onClick={this.populateQuery.bind(this)}>
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
