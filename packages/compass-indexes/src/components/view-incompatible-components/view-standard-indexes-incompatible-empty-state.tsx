import React from 'react';
import {
  EmptyContent,
  Link,
  useTranslation,
} from '@mongodb-js/compass-components';
import { ZeroRegularIndexesGraphic } from '../icons/zero-regular-indexes-graphic';

type ViewStandardIndexesIncompatibleEmptyStateProps = {
  containerClassName?: string;
};

const ViewStandardIndexesIncompatibleEmptyState = ({
  containerClassName,
}: ViewStandardIndexesIncompatibleEmptyStateProps) => {
  const t = useTranslation();
  return (
    <EmptyContent
      containerClassName={containerClassName}
      icon={ZeroRegularIndexesGraphic}
      title={t('indexes.viewEmpty.title', 'No standard indexes')}
      subTitle={t(
        'indexes.viewEmpty.subtitle',
        'Standard views use the indexes of the underlying collection. As a result, you cannot create, drop or re-build indexes on a standard view directly, nor get a list of indexes on the view.'
      )}
      callToActionLink={
        <Link
          href="https://www.mongodb.com/docs/manual/core/views/"
          target="_blank"
        >
          {t('indexes.viewEmpty.learnMore', 'Learn more about views')}
        </Link>
      }
    />
  );
};

export default ViewStandardIndexesIncompatibleEmptyState;
