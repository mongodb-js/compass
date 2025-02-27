import React, { useMemo } from 'react';

import { css, cx } from '@leafygreen-ui/emotion';

import { Modal } from './modal';
import { Button, Code, ModalFooter } from '../leafygreen';
import { ModalBody } from './modal-body';
import { ModalHeader } from './modal-header';
import { ModalFooterButton } from './modal-footer-button';

const backButtonStyles = css({
  float: 'left',
});

type ModalProps = React.ComponentProps<typeof Modal>;
type ErrorDetailsModalProps = Omit<ModalProps, 'children'> & {
  title?: string;
  subtitle?: string;
  details?: Record<string, unknown>;
  closeAction: 'close' | 'back';
  onClose: () => void;
};

function ErrorDetailsModal({
  title = 'Error details',
  subtitle,
  details,
  closeAction,
  onClose,
  ...modalProps
}: ErrorDetailsModalProps) {
  const prettyDetails = useMemo(() => {
    return JSON.stringify(details, undefined, 2);
  }, [details]);
  return (
    <Modal setOpen={onClose} {...modalProps}>
      <ModalHeader title={title} subtitle={subtitle} />
      <ModalBody>
        <Code language="json" data-testid="error-details-json">
          {prettyDetails}
        </Code>
      </ModalBody>
      <ModalFooter>
        <Button
          data-testid={`error-details-${closeAction}-button`}
          onClick={() => {
            console.log('onClick');
            onClose();
          }}
          variant="default"
          className={cx(closeAction === 'back' && backButtonStyles)}
        >
          {closeAction === 'back' ? 'Back' : 'Close'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export { ErrorDetailsModal };
