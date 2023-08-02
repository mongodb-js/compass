import React from 'react';
import { Modal, ModalVariant } from './modal';
import { ModalFooter } from '../leafygreen';

import { ModalBody } from './modal-body';
import { ModalHeader } from './modal-header';
import { ModalFooterButton } from './modal-footer-button';

type FormModalProps = React.ComponentProps<typeof Modal> & {
  variant?: Exclude<ModalVariant, 'warn'>;
  title: string;
  subtitle?: string;
  submitButtonText: string;
  cancelButtonText?: string;
  submitDisabled?: boolean;
  scroll?: boolean;
  minBodyHeight?: number;
  onSubmit: () => void;
  onCancel: () => void;
};

function FormModal({
  title,
  subtitle,
  submitButtonText,
  cancelButtonText = 'Cancel',
  submitDisabled = false,
  variant = ModalVariant.Default,
  scroll = true,
  minBodyHeight,
  onSubmit,
  onCancel,
  children,
  ...modalProps
}: FormModalProps) {
  return (
    <Modal setOpen={onCancel} {...modalProps}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <ModalHeader title={title} subtitle={subtitle} variant={variant} />
        <ModalBody variant={variant} scroll={scroll} minHeight={minBodyHeight}>
          {children}
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton
            data-testid="submit-button"
            variant={variant}
            type="submit"
            disabled={submitDisabled}
          >
            {submitButtonText}
          </ModalFooterButton>
          <ModalFooterButton
            data-testid="cancel-button"
            onClick={onCancel}
            variant="default"
          >
            {cancelButtonText}
          </ModalFooterButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export { FormModal };
