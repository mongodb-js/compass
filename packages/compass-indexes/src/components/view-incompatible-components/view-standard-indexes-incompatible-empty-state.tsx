import React from 'react';
import { EmptyContent, Link } from '@mongodb-js/compass-components';
import { ZeroGraphic } from '../search-indexes-table/zero-graphic';

type ViewStandardIndexesIncompatibleEmptyStateProps = {
  containerClassName?: string;
};

const ViewStandardIndexesIncompatibleEmptyState = ({
  containerClassName,
}: ViewStandardIndexesIncompatibleEmptyStateProps) => {
  return (
    <EmptyContent
      containerClassName={containerClassName}
      icon={ZeroGraphic}
      title="No standard indexes"
      subTitle="Standard views use the indexes of the underlying collection. As a result, you
           cannot create, drop or re-build indexes on a standard view directly, nor get a list of indexes on the view."
      callToActionLink={
        <Link
          href="https://www.mongodb.com/docs/manual/core/views/"
          target="_blank"
        >
          Learn more about views
        </Link>
      }
    />
  );
};

export default ViewStandardIndexesIncompatibleEmptyState;
