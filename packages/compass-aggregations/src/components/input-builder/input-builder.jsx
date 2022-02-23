import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Link } from '@mongodb-js/compass-components';

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
        Select an operator to construct expressions used in the aggregation
        pipeline stages. <Link href={LINK}>Learn more</Link>
      </div>
    );
  }
}

export default InputBuilder;
