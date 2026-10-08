import React from 'react';

import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { Modal } from './modal';
import { Button, ModalFooter } from '../leafygreen';
import { useTranslation } from '../../i18n';
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
  closeButtonText,
  onClose,
  children,
  ...modalProps
}: InfoModalProps) {
  const t = useTranslation();
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
            {closeButtonText ?? t('components.infoModal.close', 'Close')}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  );
}

export { InfoModal };
