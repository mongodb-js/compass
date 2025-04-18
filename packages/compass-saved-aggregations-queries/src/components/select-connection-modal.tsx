import React, { useCallback } from 'react';
import {
  FormModal,
  Radio,
  RadioGroup,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import {
  type MapDispatchToProps,
  type MapStateToProps,
  connect,
} from 'react-redux';
import { type RootState } from '../stores';
import {
  closeModal,
  connectionSelectedForPreSelectedNamespace,
  openSelectedItem,
} from '../stores/open-item';

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

type SelectConnectionModalProps = {
  namespace: string;
  itemType: string;
  itemName: string;
  isModalOpen: boolean;
  isSubmitDisabled: boolean;
  connections: { id: string; name: string }[];
  selectedConnection: string | null;
  onSelectConnection(connectionId: string): void;
  onSubmit(): void;
  onClose(): void;
};

const SelectConnectionModal: React.FunctionComponent<
  SelectConnectionModalProps
> = ({
  namespace,
  itemType,
  itemName,
  isModalOpen,
  isSubmitDisabled,
  connections,
  selectedConnection,
  onSelectConnection,
  onSubmit,
  onClose,
}) => {
  const handleConnectionSelect: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (event) => {
        onSelectConnection(event.target.value);
      },
      [onSelectConnection]
    );
  return (
    <FormModal
      open={isModalOpen}
      onCancel={onClose}
      onSubmit={() => onSubmit()}
      title={'Select a Connection'}
      submitButtonText="Run Query"
      submitDisabled={isSubmitDisabled}
      scroll={false} // this is so that the selects can hang over the footer and out of the modal
      data-testid="select-connection-modal"
    >
      <div className={modalContent}>
        <div className={description}>
          The namespace <strong>{namespace}</strong> for the saved {itemType}{' '}
          <strong>{itemName}</strong>
          <br />
          exists in multiple active connections. Please select which connection
          you&rsquo;d like to
          <br />
          run the {itemType} against.
        </div>
        <div className={connection}>
          <RadioGroup
            name="connection"
            size="small"
            onChange={handleConnectionSelect}
            value={selectedConnection ?? ''}
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

const mapState: MapStateToProps<
  Pick<
    SelectConnectionModalProps,
    | 'isModalOpen'
    | 'isSubmitDisabled'
    | 'namespace'
    | 'itemType'
    | 'itemName'
    | 'connections'
    | 'selectedConnection'
  >,
  Record<string, never>,
  RootState
> = ({
  openItem: {
    openedModal,
    selectedConnection,
    selectedItem: item,
    connections,
  },
}) => {
  return {
    isModalOpen: openedModal === 'select-connection-modal',
    isSubmitDisabled: !selectedConnection,
    namespace: `${item?.database ?? ''}.${item?.collection ?? ''}`,
    itemType: item?.type ?? '',
    itemName: item?.name ?? '',
    connections,
    selectedConnection,
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<
    SelectConnectionModalProps,
    'onSubmit' | 'onClose' | 'onSelectConnection'
  >,
  Record<string, never>
> = {
  onSubmit: openSelectedItem,
  onClose: closeModal,
  onSelectConnection: connectionSelectedForPreSelectedNamespace,
};

export default connect(mapState, mapDispatch)(SelectConnectionModal);
