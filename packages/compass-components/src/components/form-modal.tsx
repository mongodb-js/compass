import React from 'react';
import { Variant as ButtonVariant } from '@leafygreen-ui/button';
import { Modal } from './modal';
import { ModalFooter } from './leafygreen';

import { ModalContent } from './modal-content';
import { ModalHeader } from './modal-header';
import { ModalFooterButton } from './modal-footer-button';

export const Variant = {
  Default: ButtonVariant.Primary,
  Danger: ButtonVariant.Danger,
} as const;

export type Variant = typeof Variant[keyof typeof Variant];

type FormModalProps = React.ComponentProps<typeof Modal> & {
  variant?: Variant;
  title: string;
  subtitle?: string;
  submitButtonText: string;
  cancelButtonText?: string;
  submitDisabled?: boolean;
  scroll?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

function FormModal({
  title,
  subtitle,
  submitButtonText,
  cancelButtonText = 'Cancel',
  submitDisabled = false,
  variant = Variant.Default,
  scroll,
  onSubmit,
  onCancel,
  children,
  ...modalProps
}: FormModalProps) {
  return (
    <Modal setOpen={onCancel} contentVariant="with-footer" {...modalProps}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <ModalHeader title={title} subtitle={subtitle} variant={variant} />
        <ModalContent variant={variant} scroll={scroll}>
          {children}
        </ModalContent>
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
