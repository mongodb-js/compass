import { css, cx, Modal, spacing } from '@mongodb-js/compass-components';
import React, { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ConnectionFormProps } from '@mongodb-js/connection-form';
import ConnectionForm from '@mongodb-js/connection-form';

const modalStyles = css({
  '& > div': {
    height: '100%',
  },
});

const modalContentStyles = css({
  width: '960px',
  maxWidth: '960px',
  margin: 0,

  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'stretch',

  '& > div': {
    width: '100%',
  },
});

const modalContentFullHeightStyles = css({
  height: '100%',
  maxHeight: spacing[1600] * 18,
});

export default function ConnectionFormModal({
  isOpen,
  setOpen,
  ...rest
}: {
  isOpen: boolean;
  setOpen: (open: boolean) => void | Dispatch<SetStateAction<boolean>>;
  onCancel: () => void; // when using
} & Omit<
  ConnectionFormProps,
  'showFooterBorder' | 'showHelperCardsInForm' | 'onAdvancedOptionsToggle'
>): React.ReactElement {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <Modal
      open={isOpen}
      setOpen={setOpen}
      data-testid="connection-form-modal"
      className={modalStyles}
      contentClassName={cx(
        modalContentStyles,
        advancedOpen && modalContentFullHeightStyles
      )}
    >
      <ConnectionForm
        // Key is not applied to the Modal itself or the upper component so that
        // the animation stays smooth, otherwise React will hard unmount the
        // modal when connection info changes, for our case it's enough for this
        // to happen only for the connection form itself
        key={rest.initialConnectionInfo.id}
        onAdvancedOptionsToggle={setAdvancedOpen}
        {...rest}
      />
    </Modal>
  );
}
