import React, { useCallback } from 'react';
import {
  css,
  spacing,
  Banner,
  Body,
  Description,
  Label,
  Link,
  Toggle,
  InfoModal,
} from '@mongodb-js/compass-components';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';

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

export type CSFLEConnectionModalProps = {
  open: boolean;
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
  onClose: () => void;
  setConnectionIsCSFLEEnabled: (isEnabled: boolean) => void;
};

export default function CSFLEConnectionModal({
  open,
  csfleMode,
  onClose,
  setConnectionIsCSFLEEnabled,
}: CSFLEConnectionModalProps) {
  const onChange = useCallback(
    (checked: boolean) => {
      setConnectionIsCSFLEEnabled(checked);
    },
    [setConnectionIsCSFLEEnabled]
  );

  useTrackOnChange(
    (track: TrackFunction) => {
      if (open) {
        track('Screen', { name: 'csfle_connection_modal' });
      }
    },
    [open],
    undefined
  );

  return (
    <InfoModal
      title="In-Use Encryption Connection Options"
      open={open}
      onClose={onClose}
      data-testid="csfle-connection-modal"
    >
      <Body>This connection is configured with In-Use Encryption enabled.</Body>
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
      <Banner className={csfleBannerStyles}>
        In-Use Encryption is an Enterprise/Atlas-only feature of MongoDB.&nbsp;
        {/* TODO(COMPASS-5925): Use generic In-Use Encryption URL */}
        <Link href="https://dochub.mongodb.org/core/rqe-encrypted-fields">
          Learn More
        </Link>
      </Banner>
    </InfoModal>
  );
}
