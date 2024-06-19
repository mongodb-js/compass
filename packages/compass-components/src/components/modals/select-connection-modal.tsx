import React, { useCallback } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Radio, RadioGroup } from '@leafygreen-ui/radio-group';
import { FormModal } from './form-modal';

const modalContent = css({
  display: 'grid',
  gridAutoColumns: '1fr',
  rowGap: spacing[600],
  columnGap: spacing[400],
  gridTemplateAreas: `
    'description'
    'connection'
  `,
});

const description = css({
  gridArea: 'description',
});

const connection = css({
  gridArea: 'connection',
});

export type SelectConnectionModalProps = {
  modalTitle?: string;
  descriptionText?: React.ReactNode;
  isModalOpen: boolean;
  isSubmitDisabled: boolean;
  submitButtonText: string;
  connections: { id: string; name: string }[];
  selectedConnectionId: string;

  onClose(): void;
  onSubmit(): void;
  onConnectionSelected(connectionId: string): void;
};

export const SelectConnectionModal: React.FunctionComponent<
  SelectConnectionModalProps
> = ({
  modalTitle = 'Select a Connection',
  isModalOpen,
  descriptionText,
  isSubmitDisabled,
  submitButtonText,
  connections,
  selectedConnectionId,
  onClose,
  onSubmit,
  onConnectionSelected,
}) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleSubmit = useCallback(() => onSubmit(), [onSubmit]);
  const handleConnectionSelect: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (event) => {
        onConnectionSelected(event.target.value);
      },
      [onConnectionSelected]
    );
  return (
    <FormModal
      scroll={false} // this is so that the selects can hang over the footer and out of the modal
      open={isModalOpen}
      title={modalTitle}
      submitButtonText={submitButtonText}
      submitDisabled={isSubmitDisabled}
      onCancel={handleClose}
      onSubmit={handleSubmit}
      data-testid="select-connection-modal"
    >
      <div className={modalContent}>
        {descriptionText && (
          <div className={description}>{descriptionText}</div>
        )}
        <div className={connection}>
          <RadioGroup
            name="connection"
            size="small"
            onChange={handleConnectionSelect}
            value={selectedConnectionId}
          >
            {connections.map(({ id, name }) => (
              <Radio key={id} value={id} data-testid={`connection-item-${id}`}>
                {name}
              </Radio>
            ))}
          </RadioGroup>
        </div>
      </div>
    </FormModal>
  );
};
