import React from 'react';
import PropTypes from 'prop-types';
import { css, Banner, BannerVariant } from '@mongodb-js/compass-components';
import type { InsertCSFLEState } from '../stores/crud-store';

export type InsertCSFLEWarningBannerProps = {
  csfleState: InsertCSFLEState;
};

const listStyles = css({ listStyle: 'inherit' });

function InsertCSFLEWarningBanner({
  csfleState,
}: InsertCSFLEWarningBannerProps) {
  let fieldsNotice = undefined;
  if (csfleState.encryptedFields && csfleState.encryptedFields.length > 0) {
    fieldsNotice = (
      <div>
        The following fields will be encrypted according to the collection
        schema:&nbsp;
        <ul className={listStyles}>
          {csfleState.encryptedFields.map((fieldName) => (
            <li key={fieldName}>{fieldName}</li>
          ))}
        </ul>
      </div>
    );
  }

  switch (csfleState.state) {
    case 'none':
      return <></>;

    case 'no-known-schema':
      return (
        <Banner variant={BannerVariant.Warning}>
          This insert operation will not encrypt any document fields because no
          schema or In-Use Encryption configuration is associated with the
          collection.
        </Banner>
      );

    case 'incomplete-schema-for-cloned-doc':
      return (
        <Banner
          data-testid="incomplete-schema-for-cloned-doc"
          variant={BannerVariant.Danger}
        >
          This insert operation will not encrypt all fields that were encrypted
          in the original document due to a missing or incomplete schema for
          this collection.
          {fieldsNotice}
        </Banner>
      );

    case 'has-known-schema':
      return (
        <Banner
          data-testid="insert-csfle-has-known-schema"
          variant={BannerVariant.Info}
        >
          This insert operation will encrypt all fields that are specified in
          the schema or In-Use Encryption configuration associated with the
          collection.
          {fieldsNotice}
        </Banner>
      );

    case 'csfle-disabled':
      return (
        <Banner variant={BannerVariant.Warning}>
          This insert operation will not encrypt any document fields because
          In-Use Encryption support was explicitly disabled.
        </Banner>
      );

    default:
      throw new Error(
        `Unknown CSFLE state ${csfleState.state as string} (Compass bug)`
      );
  }
}

(InsertCSFLEWarningBanner as any).displayName = 'InsertCSFLEWarningBanner';

(InsertCSFLEWarningBanner as any).propTypes = {
  csfleState: PropTypes.object.isRequired,
};

export default InsertCSFLEWarningBanner;
