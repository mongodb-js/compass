import React from 'react';
import {
  Badge,
  BadgeVariant,
  css,
  useTranslation,
} from '@mongodb-js/compass-components';

const modifySourceBannerStyles = css({
  display: 'inline-block',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

/**
 * The blue banner displayed when modifying a source pipeline.
 */
const ModifySourceBanner = (props: { editViewName: string }) => {
  const t = useTranslation();
  const bannerText = t(
    'aggregations.modifySourceBanner',
    'Modifying pipeline backing "{name}"',
    { name: props.editViewName }
  );
  return (
    <Badge
      className={modifySourceBannerStyles}
      variant={BadgeVariant.Blue}
      data-testid="modify-source-banner"
      title={bannerText}
    >
      {bannerText}
    </Badge>
  );
};

export default ModifySourceBanner;
