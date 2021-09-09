import React from 'react';
import Banner, { Variant } from '@leafygreen-ui/banner';

import styles from './explain-cannot-visualize-banner.module.less';

export function ExplainCannotVisualizeBanner() {
  return (
    <Banner
      className={styles['explain-cannot-visualize-banner']}
      variant={Variant.Warning}
    >
      Visual explain plan is not supported with this query on this
      collection in this Compass release. Please refer to
      the raw json output of the explain for insight into the operation.
    </Banner>
  );
}

export default ExplainCannotVisualizeBanner;
