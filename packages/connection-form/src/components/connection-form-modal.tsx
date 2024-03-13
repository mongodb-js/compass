import { Modal } from '@mongodb-js/compass-components';
import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ConnectionFormProps } from './connection-form';
import ConnectionForm from './connection-form';

export default function ConnectionFormModal({
  isOpen,
  setOpen,
  ...rest
}: {
  isOpen: boolean;
  setOpen: (open: boolean) => void | Dispatch<SetStateAction<boolean>>;
} & ConnectionFormProps): React.ReactElement {
  return (
    <Modal open={isOpen} setOpen={setOpen}>
      <ConnectionForm {...rest} />
    </Modal>
  );
}
