import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  css,
  Banner,
  Button,
  Modal,
  Link,
  ModalFooter,
  ModalTitle,
  spacing,
  Body,
  ButtonVariant,
  BannerVariant
} from '@mongodb-js/compass-components';

const modalContentWrapperStyles = css({
  padding: 'initial'
});

const modalContentStyles = css({
  padding: spacing[5]
});

const modalBodyStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[2]
});

const DESCRIPTION = 'Some documented MongoDB features may work differently, be entirely missing'
  + ' or incomplete, or have unexpected performance characteristics. ';
const WARNING_BANNER = 'This server or service appears to be an emulation of MongoDB rather than an official MongoDB product.';
const LEARN_MORE_URL = 'https://docs.mongodb.com/compass/master/faq/#how-does-compass-determine-a-connection-is-not-genuine';
const MODAL_TITLE = 'Non-Genuine MongoDB Detected';

function NonGenuineWarningModal({
  isVisible,
  toggleIsVisible,

}) {
  const onClose = useCallback(() => {
    toggleIsVisible(false);
  }, [toggleIsVisible]);

  return (
    <Modal
      open={isVisible}
      trackingId="non_genuine_mongodb_modal"
      setOpen={onClose}
      contentClassName={modalContentWrapperStyles}
    >
      <div
        className={modalContentStyles}
      >
        <ModalTitle>{MODAL_TITLE}</ModalTitle>
        <Banner
          variant={BannerVariant.Warning}
        >
          {WARNING_BANNER}
        </Banner>
        <Body className={modalBodyStyles}>{DESCRIPTION}</Body>
        <Link
          href={LEARN_MORE_URL}
          target="_blank"
          data-test-id="non-genuine-warning-modal-learn-more-link"
        >Learn more</Link>
      </div>
      <ModalFooter>
        <Button
          onClick={onClose}
          variant={ButtonVariant.Primary}
          data-test-id="continue-button"
        >
          Continue
        </Button>
      </ModalFooter>
    </Modal>
  );
}

NonGenuineWarningModal.displayName = 'NonGenuineWarningModal';
NonGenuineWarningModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  toggleIsVisible: PropTypes.func.isRequired
};

export default NonGenuineWarningModal;
