import React from 'react';

import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { Modal } from './modal';
import { Button, ModalFooter } from '../leafygreen';
import { ModalBody } from './modal-body';
import { ModalHeader } from './modal-header';

const paddingBottomStyles = css({ paddingBottom: spacing[800] });

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
      className={cx(!showCloseButton && paddingBottomStyles)}
      {...modalProps}
    >
      <ModalHeader title={title} subtitle={subtitle} />
      <ModalBody>{children}</ModalBody>
      {showCloseButton && (
        <ModalFooter>
          <Button
            data-testid="close-button"
            onClick={onClose}
            variant="default"
          >
            {closeButtonText}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  );
}

export { InfoModal };
