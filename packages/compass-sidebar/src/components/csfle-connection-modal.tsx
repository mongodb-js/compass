import React, { useCallback } from 'react';
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

export default function CSFLEConnectionModal({
  csfleMode,
  open,
  setOpen,
  setConnectionIsCSFLEEnabled,
}: {
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  setConnectionIsCSFLEEnabled: (isEnabled: boolean) => void;
}) {
  const onChange = useCallback(
    (checked: boolean) => {
      setConnectionIsCSFLEEnabled(checked);
    },
    [setConnectionIsCSFLEEnabled]
  );

  return (
    <Modal
      open={open}
      trackingId="csfle_connection_modal"
      setOpen={setOpen}
      data-testid="csfle-connection-modal"
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
            onChange={onChange}
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
