import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './input-builder.module.less';

const LINK = 'https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/';

class InputBuilder extends PureComponent {
  static displayName = 'InputBuilderComponent';

  static propTypes = {
    openLink: PropTypes.func.isRequired
  }

  learnMore = () => {
    this.props.openLink(LINK);
  }

  render() {
    return (
      <div className={styles['input-builder']}>
        Select an operator to construct expressions used in the aggregation pipeline stages.
        <span onClick={this.learnMore} className={styles['input-builder-link']}>
          Learn more
        </span>
      </div>
    );
  }
}

export default InputBuilder;
