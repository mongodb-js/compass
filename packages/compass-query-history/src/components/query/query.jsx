import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Code, Label, css, spacing } from '@mongodb-js/compass-components';

import { formatQuery } from '../../utils';

const queryAttributesContainerStyles = css({
  cursor: 'pointer',
  outline: 'none',
  border: 'none',
  background: 'none',
  paddingLeft: 0,
  margin: 0,
  textAlign: 'left',
  width: '100%',
});

const queryAttributeStyles = css({
  marginTop: spacing[1],
});

const labelStyles = css({
  textTransform: 'capitalize',
});

const codeStyles = css({
  maxHeight: '30vh',
});

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

    return (
      <div
        data-test-id="query-history-query-attribute"
        className={queryAttributeStyles}
        key={index}
      >
        <Label
          data-test-id="query-history-query-label"
          className={labelStyles}
          htmlFor={`query-history-query-attr-${attrKey}`}
        >{attrKey}</Label>
        <Code
          className={codeStyles}
          id={`query-history-query-attr-${attrKey}`}
          data-test-id="query-history-query-code"
          language="javascript"
          copyable={false}
        >
          {formatQuery(attributes[attrKey])}
        </Code>
      </div>
    );
  };

  render() {
    const { attributes } = this.props;

    return (
      <button
        onClick={this.populateQuery}
        className={queryAttributesContainerStyles}
        data-test-id="query-history-query-attributes"
      >
        { Object.keys(attributes).map(this.renderAttr) }
      </button>
    );
  }
}

export default Query;
export { Query };
