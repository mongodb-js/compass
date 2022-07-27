import React from 'react';
import PropTypes from 'prop-types';
import {
  css,
  spacing,
  Banner,
  Body,
  Description,
  ModalTitle,
  Label,
  Link,
  Toggle,
  Modal,
} from '@mongodb-js/compass-components';

const toggleStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
  marginRight: spacing[3],
});

const toggleContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const csfleBannerStyles = css({
  marginTop: spacing[3],
});

function CSFLEConnectionModal({
  csfleMode,
  open,
  setOpen,
  setConnectionIsCSFLEEnabled,
}) {
  return (
    <Modal
      open={open}
      title="In-Use Encryption"
      trackingId="csfle_connection_modal"
      setOpen={setOpen}
      data-test-id="csfle-connection-modal"
    >
      <div>
        <ModalTitle>In-Use Encryption Connection Options</ModalTitle>
        <Body>
          This connection is configured with In-Use Encryption enabled.
        </Body>
        <div className={toggleContainerStyles}>
          <Toggle
            className={toggleStyles}
            id="set-csfle-enabled"
            aria-labelledby="set-csfle-enabled-label"
            size="small"
            type="button"
            checked={csfleMode === 'enabled'}
            onChange={(checked) => {
              setConnectionIsCSFLEEnabled(checked);
            }}
          />
          <Label id="set-csfle-enabled-label" htmlFor="set-csfle-enabled">
            Enable In-Use Encryption for this connection
          </Label>
        </div>
        <Description>
          Disabling In-Use Encryption only affects how Compass accesses data. In
          order to make Compass forget KMS credentials, the connection must be
          fully closed.
        </Description>
      </div>
      <Banner className={csfleBannerStyles}>
        In-Use Encryption is an Enterprise/Atlas-only feature of MongoDB.&nbsp;
        {/* TODO(COMPASS-5925): Use generic In-Use Encryption URL */}
        <Link href="https://dochub.mongodb.org/core/rqe-encrypted-fields">
          Learn More
        </Link>
      </Banner>
    </Modal>
  );
}

CSFLEConnectionModal.displayName = 'CSFLEConnectionModal';
CSFLEConnectionModal.propTypes = {
  csfleMode: PropTypes.string,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  setConnectionIsCSFLEEnabled: PropTypes.func.isRequired,
};

export default CSFLEConnectionModal;
