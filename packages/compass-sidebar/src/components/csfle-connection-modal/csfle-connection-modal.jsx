import React from 'react';
import PropTypes from 'prop-types';
import {
  css, spacing, Banner, Body, Description, ModalTitle, Label, Link, Toggle, Modal
} from '@mongodb-js/compass-components';

const toggleStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
  marginRight: spacing[3]
});

const toggleContainerStyles = css({
  display: 'flex',
  alignItems: 'center'
});

const csfleBannerStyles = css({
  marginTop: spacing[3]
});

function CSFLEConnectionModal({ csfleMode, open, setOpen, setConnectionIsCSFLEEnabled }) {
  return (<Modal
    open={open}
    title="Client-Side Field-Level Encryption"
    trackingId="csfle_connection_modal"
    setOpen={setOpen}
  >
    <div>
      <ModalTitle>CSFLE Connection Options</ModalTitle>
      <Body>
          This connection is configured with Client-Side Field-Level Encryption enabled.
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
        <Label
          id="set-csfle-enabled-label"
          htmlFor="set-csfle-enabled"
        >
            Enable CSFLE for this connection
        </Label>
      </div>
      <Description>
          Disabling CSFLE only affects how Compass accesses data.
          In order to make Compass forget KMS credentials, the
          connection must be fully closed.
      </Description>
    </div>
    <Banner className={csfleBannerStyles}>
        Client-side Field-Level Encryption is an Enterprise/Atlas-only feature
        of MongoDB.&nbsp;
      <Link href="https://www.mongodb.com/docs/drivers/security/client-side-field-level-encryption-guide/">
          Learn More
      </Link>
    </Banner>
  </Modal>);
}

CSFLEConnectionModal.displayName = 'CSFLEConnectionModal';
CSFLEConnectionModal.propTypes = {
  csfleMode: PropTypes.string,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  setConnectionIsCSFLEEnabled: PropTypes.func.isRequired
};

export default CSFLEConnectionModal;
