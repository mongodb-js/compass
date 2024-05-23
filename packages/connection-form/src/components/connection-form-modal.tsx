import { css, Modal } from '@mongodb-js/compass-components';
import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ConnectionFormProps } from './connection-form';
import ConnectionForm from './connection-form';

const modalContentStyles = css({
  width: '960px',
});

export default function ConnectionFormModal({
  isOpen,
  setOpen,
  ...rest
}: {
  isOpen: boolean;
  setOpen: (open: boolean) => void | Dispatch<SetStateAction<boolean>>;
  onCancel: () => void; // when using
} & ConnectionFormProps): React.ReactElement {
  return (
    <Modal
      open={isOpen}
      setOpen={setOpen}
      contentClassName={modalContentStyles}
      data-testid="connection-form-modal"
    >
      <ConnectionForm {...rest} />
    </Modal>
  );
}
