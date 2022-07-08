import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Code } from '@mongodb-js/compass-components';

import { formatQuery } from '../../utils';

import styles from './query.module.less';

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
   * projection will cause the document list to go into readonly mode.
   * We don't allow editing of documents if there is a projection
   * and there's no need for an empty projection in the query bar
   * as the default placeholder will not display.
   **/
  populateQuery = () => {
    this.props.actions.runQuery(this.props.attributes);
  };

  renderAttr = (attrKey, index) => {
    const { attributes } = this.props;

    if (typeof attributes[attrKey] === 'undefined') {
      return null;
    }

    return (
      <li key={index}>
        <label
          data-test-id="query-history-query-label"
          className={styles.label}>{attrKey}</label>
        <Code
          className={styles.code}
          data-test-id="query-history-query-code"
          language="javascript"
          copyable={false}
        >
          {formatQuery(attributes[attrKey])}
        </Code>
      </li>
    );
  };

  render() {
    const { attributes } = this.props;

    return (
      <ul
        onClick={this.populateQuery}
        className={styles.component}
        data-test-id="query-history-query-attributes">
        { Object.keys(attributes).map(this.renderAttr) }
      </ul>
    );
  }
}

export default Query;
export { Query };
