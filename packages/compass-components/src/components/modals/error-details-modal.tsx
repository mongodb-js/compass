import React, { useMemo } from 'react';

import { css, cx } from '@leafygreen-ui/emotion';

import { Modal } from './modal';
import { Button, Code, ModalFooter } from '../leafygreen';
import { ModalBody } from './modal-body';
import { ModalHeader } from './modal-header';

const leftDirectionFooter = css({
  justifyContent: 'left',
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
  open,
  ...modalProps
}: ErrorDetailsModalProps) {
  const prettyDetails = useMemo(
    () => JSON.stringify(details, undefined, 2),
    [details]
  );

  return (
    <Modal
      setOpen={onClose}
      initialFocus="#error-details-json"
      open={open}
      {...modalProps}
    >
      <ModalHeader title={title} subtitle={subtitle} />
      <ModalBody>
        <Code
          language="json"
          data-testid="error-details-json"
          id="error-details-json"
        >
          {prettyDetails}
        </Code>
      </ModalBody>
      <ModalFooter
        className={cx(closeAction === 'back' && leftDirectionFooter)}
      >
        <Button
          data-testid={`error-details-${closeAction}-button`}
          onClick={onClose}
          variant="default"
        >
          {closeAction === 'back' ? 'Back' : 'Close'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export { ErrorDetailsModal };
