import React from 'react';
import { Badge, BadgeVariant, css } from '@mongodb-js/compass-components';

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
  const bannerText = `Modifying pipeline backing "${props.editViewName}"`;
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
