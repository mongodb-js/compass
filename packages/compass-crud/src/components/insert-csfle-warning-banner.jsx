import React from 'react';
import PropTypes from 'prop-types';
import { Banner, BannerVariant } from '@mongodb-js/compass-components';

function InsertCSFLEWarningBanner({ csfleState }) {
  switch (csfleState) {
    case 'none':
      return <></>;

    case 'no-known-schema':
      return (
        <Banner variant={BannerVariant.Warning}>
          This insert operation will not encrypt any document fields because
          no schema or CSFLE configuration is associated with the collection.
        </Banner>
      );

    case 'incomplete-schema-for-cloned-doc':
      return (
        <Banner variant={BannerVariant.Danger}>
          This insert operation will not encrypt all fields that were encrypted in the original
          document due to a missing or incomplete schema for this collection.
        </Banner>
      );

    case 'has-known-schema':
      return (
        <Banner variant={BannerVariant.Info}>
          This insert operation will encrypt all fields that are specified in the schema
          or CSFLE configuration associated with the collection.
        </Banner>
      );

    case 'csfle-disabled':
      return (
        <Banner variant={BannerVariant.Warning}>
          This insert operation will not encrypt any document fields because
          CSFLE support was explicitly disabled.
        </Banner>
      );

    default:
      throw new Error(`Unknown CSFLE state ${csfleState} (Compass bug)`);
  }
}

InsertCSFLEWarningBanner.displayName = 'InsertCSFLEWarningBanner';

InsertCSFLEWarningBanner.propTypes = {
  csfleState: PropTypes.string.isRequired
};

export default InsertCSFLEWarningBanner;
