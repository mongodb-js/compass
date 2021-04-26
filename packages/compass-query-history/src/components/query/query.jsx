import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { formatQuery } from 'utils';

import Code from 'components/code';
import styles from './query.less';

class Query extends PureComponent {
  static displayName = 'Query';

  static propTypes = {
    attributes: PropTypes.object,
    actions: PropTypes.object.isRequired
  };

  static defaultProps = {};

  /**
   * Populate the query bar with the value of this query.
   *
   * @note:
   * Durran/Jessica: Don't default the attributes as the empty
   * projection will cause the document list to go into readony mode.
   * We don't allow editing of documents if there is a projection
   * and there's no need for an empty projection in the query bar
   * as the default placeholder will not display.
   **/
  populateQuery = () => {
    this.props.actions.runQuery(this.props.attributes);
  };

  renderAttr = (attrKey, index) => {
    const { attributes } = this.props;

    return (
      <li key={index}>
        <label
          data-test-id="query-history-query-label"
          className={classnames(styles.label)}>{attrKey}</label>
        <Code
          data-test-id="query-history-query-code"
          code={formatQuery(attributes[attrKey])}
          language="js" />
      </li>
    );
  };

  render() {
    const { attributes } = this.props;

    return (
      <ul
        onClick={this.populateQuery}
        className={classnames(styles.component)}
        data-test-id="query-history-query-attributes">
        { Object.keys(attributes).map(this.renderAttr) }
      </ul>
    );
  }
}

export default Query;
export { Query };
