import React, { useCallback } from 'react';
import {
  css,
  Banner,
  Button,
  Modal,
  Link,
  ModalHeader,
  ModalContent,
  ModalFooter,
  spacing,
  Body,
  ButtonVariant,
  BannerVariant,
} from '@mongodb-js/compass-components';

const modalBodyStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[2],
});

const DESCRIPTION =
  'Some documented MongoDB features may work differently, be entirely missing' +
  ' or incomplete, or have unexpected performance characteristics. ';
const WARNING_BANNER =
  'This server or service appears to be an emulation of MongoDB rather than an official MongoDB product.';
const LEARN_MORE_URL =
  'https://docs.mongodb.com/compass/master/faq/#how-does-compass-determine-a-connection-is-not-genuine';
const MODAL_TITLE = 'Non-Genuine MongoDB Detected';

function NonGenuineWarningModal({
  isVisible,
  toggleIsVisible,
}: {
  isVisible: boolean;
  toggleIsVisible: (visible: boolean) => void;
}) {
  const onClose = useCallback(() => {
    toggleIsVisible(false);
  }, [toggleIsVisible]);

  return (
    <Modal
      open={isVisible}
      trackingId="non_genuine_mongodb_modal"
      data-testid="non-genuine-mongodb-modal"
      setOpen={onClose}
      contentVariant="with-footer"
    >
      <ModalHeader title={MODAL_TITLE} />
      <ModalContent>
        <Banner variant={BannerVariant.Warning}>{WARNING_BANNER}</Banner>
        <Body className={modalBodyStyles}>{DESCRIPTION}</Body>
        <Link
          href={LEARN_MORE_URL}
          target="_blank"
          data-testid="non-genuine-warning-modal-learn-more-link"
        >
          Learn more
        </Link>
      </ModalContent>
      <ModalFooter>
        <Button
          onClick={onClose}
          variant={ButtonVariant.Primary}
          data-testid="continue-button"
        >
          Continue
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default NonGenuineWarningModal;
