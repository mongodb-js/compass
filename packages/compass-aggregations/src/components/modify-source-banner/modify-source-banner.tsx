import React from 'react';
import PropTypes from 'prop-types';
import { Badge, BadgeVariant, css } from '@mongodb-js/compass-components';

const modifySourceBannerStyles = css({
  textAlign: 'center',
  margin: '5px auto',
  marginTop: '20px',
  zIndex: 500,
});

/**
 * The blue banner displayed when modifying a source pipeline.
 */
const ModifySourceBanner = (props: { editViewName: React.ReactNode }) => {
  return (
    <Badge
      className={modifySourceBannerStyles}
      variant={BadgeVariant.Blue}
      data-testid="modify-source-banner"
    >
      Modifying pipeline backing &quot;{props.editViewName}&quot;
    </Badge>
  );
};

ModifySourceBanner.propTypes = {
  editViewName: PropTypes.string.isRequired,
};

export default ModifySourceBanner;
