import React from 'react';
import Banner, { Variant } from '@leafygreen-ui/banner';

import styles from './explain-time-series-banner.less';

export function ExplainTimeSeries() {
  return (
    <Banner
      className={styles['explain-time-series-banner']}
      variant={Variant.Warning}
    >
      Visual analysis of the explain plan of a query on a time series
      collection is not supported in this Compass release. Please refer to
      the raw json output of the explain for insight into the operation.
    </Banner>
  );
}

export default ExplainTimeSeries;
