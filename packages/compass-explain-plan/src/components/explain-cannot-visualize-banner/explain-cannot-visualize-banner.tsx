import React from 'react';
import { Banner, BannerVariant } from '@mongodb-js/compass-components';

export function ExplainCannotVisualizeBanner() {
  return (
    <Banner variant={BannerVariant.Warning}>
      Visual explain plan is not supported with this query on this collection in
      this Compass release. Please refer to the raw json output of the explain
      for insight into the operation.
    </Banner>
  );
}

export default ExplainCannotVisualizeBanner;
