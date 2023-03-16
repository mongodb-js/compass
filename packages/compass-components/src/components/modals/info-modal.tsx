import React from 'react';

import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { Modal } from './modal';
import { ModalFooter } from '../leafygreen';
import { ModalBody } from './modal-body';
import { ModalHeader } from './modal-header';
import { ModalFooterButton } from './modal-footer-button';

const paddingBottomStyles = css({ paddingBottom: spacing[5] });

type InfoModalProps = React.ComponentProps<typeof Modal> & {
  title: string;
  subtitle?: string;
  showCloseButton?: boolean;
  closeButtonText?: string;
  onClose: () => void;
};

function InfoModal({
  title,
  subtitle,
  showCloseButton = true,
  closeButtonText = 'Close',
  onClose,
  children,
  ...modalProps
}: InfoModalProps) {
  return (
    <Modal
      setOpen={onClose}
      contentClassName={cx(!showCloseButton && paddingBottomStyles)}
      {...modalProps}
    >
      <ModalHeader title={title} subtitle={subtitle} />
      <ModalBody>{children}</ModalBody>
      {showCloseButton && (
        <ModalFooter>
          <ModalFooterButton
            data-testid="close-button"
            onClick={onClose}
            variant="default"
          >
            {closeButtonText}
          </ModalFooterButton>
        </ModalFooter>
      )}
    </Modal>
  );
}

export { InfoModal };
