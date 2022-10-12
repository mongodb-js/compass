import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { Variant as ButtonVariant } from '@leafygreen-ui/button';
import { Modal } from './modal';
import { Button, ModalFooter } from './leafygreen';
import { Theme, withTheme } from '../hooks/use-theme';

import { ModalContent } from './modal-content';
import { ModalHeader } from './modal-header';

export const Variant = {
  Default: ButtonVariant.Primary,
  Danger: ButtonVariant.Danger,
} as const;

export type Variant = typeof Variant[keyof typeof Variant];

const baseModalStyle = css`
  width: 600px;
  padding: initial;
  letter-spacing: 0;
`;

const buttonStyle = {
  [Theme.Light]: css`
    margin: 0 2px;
    &:first-of-type {
      margin: 0 0 0 5px;
    }
    &:last-of-type {
      margin: 0 5px 0 0;
    }
  `,
  [Theme.Dark]: css`
    margin: 0 2px;
    &:first-of-type {
      margin: 0 0 0 4px;
    }
    &:last-of-type {
      margin: 0 4px 0 0;
    }
  `,
};

type FormModalProps = React.ComponentProps<typeof Modal> & {
  variant?: Variant;
  title: string;
  subtitle?: string;
  submitButtonText: string;
  cancelButtonText?: string;
  submitDisabled?: boolean; // TODO
  onSubmit: () => void;
  onCancel: () => void;
};

function UnthemedFormModal({
  title,
  subtitle,
  submitButtonText,
  cancelButtonText = 'Cancel',
  submitDisabled = false,
  variant = Variant.Default,
  onSubmit,
  onCancel,
  darkMode,
  children,
  ...modalProps
}: FormModalProps) {
  const theme = darkMode ? Theme.Dark : Theme.Light;

  return (
    <Modal
      contentClassName={baseModalStyle}
      setOpen={onCancel}
      darkMode={darkMode}
      {...modalProps}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <ModalHeader title={title} subtitle={subtitle} variant={variant} />
        <ModalContent variant={variant}>{children}</ModalContent>
        <ModalFooter>
          <Button
            data-testid="submit-button"
            className={buttonStyle[theme]}
            variant={variant}
            type="submit"
            disabled={submitDisabled}
          >
            {submitButtonText}
          </Button>
          <Button
            data-testid="cancel-button"
            className={buttonStyle[theme]}
            onClick={onCancel}
            variant="default"
          >
            {cancelButtonText}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

const FormModal = withTheme(UnthemedFormModal);

export { FormModal };
