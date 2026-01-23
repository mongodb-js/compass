import React from 'react';
import { Variant as ButtonVariant } from '@leafygreen-ui/button';
import { Modal } from './modal';
import { Button, ModalFooter } from '../leafygreen';

import { ModalBody } from './modal-body';
import { ModalHeader } from './modal-header';
import { css, spacing } from '../..';

const footerStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[200],
});

export const Variant = {
  Default: ButtonVariant.Primary,
  Danger: ButtonVariant.Danger,
} as const;

export type Variant = (typeof Variant)[keyof typeof Variant];

type FormModalProps = React.ComponentProps<typeof Modal> & {
  variant?: Variant;
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
  variant = Variant.Default,
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
        <ModalFooter className={footerStyles}>
          <Button
            data-testid="cancel-button"
            onClick={onCancel}
            variant="default"
          >
            {cancelButtonText}
          </Button>
          <Button
            data-testid="submit-button"
            variant={variant}
            type="submit"
            disabled={submitDisabled}
          >
            {submitButtonText}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export { FormModal };
