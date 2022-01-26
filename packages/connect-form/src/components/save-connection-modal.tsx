import React, { useState } from 'react';
import {
  ConnectionInfo
} from 'mongodb-data-service';

import FormFieldContainer from './form-field-container';
import SavedConnectionColorPicker from './saved-connection-color-picker';

import { useUiKitContext } from '../contexts/ui-kit-context';

function SaveConnectionModal({
  initialConnectionInfo,
  onCancelClicked,
  onSaveClicked,
  open,
}: {
  initialConnectionInfo: ConnectionInfo;
  onCancelClicked: () => void;
  onSaveClicked: (favoriteInfo: any) => Promise<void>;
  open: boolean;
}): React.ReactElement {
  const {
    ConfirmationModal,
    TextInput,
    css,
    spacing,
  } = useUiKitContext();

  const connectionNameInputStyles = css({
    marginTop: spacing[5],
  });

  const [editingFavorite, setEditingFavorite] = useState({
    name: '',
    ...initialConnectionInfo.favorite,
  });

  return (
    <ConfirmationModal
      title={
        initialConnectionInfo.favorite
          ? 'Edit favorite'
          : 'Save connection to favorites'
      }
      open={open}
      onConfirm={() => {
        void onSaveClicked({
          ...initialConnectionInfo.favorite,
          ...editingFavorite,
        });
      }}
      onCancel={onCancelClicked}
      buttonText="Save"
    >
      <FormFieldContainer>
        <TextInput
          className={connectionNameInputStyles}
          spellCheck={false}
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            setEditingFavorite({
              ...editingFavorite,
              name: value,
            });
          }}
          label="Name"
          placeholder="Connection name"
          value={editingFavorite.name}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <SavedConnectionColorPicker
          hex={editingFavorite.color}
          onChange={(newColor?: string) => {
            setEditingFavorite({
              ...editingFavorite,
              color: newColor,
            });
          }}
        />
      </FormFieldContainer>
    </ConfirmationModal>
  );
}

export default SaveConnectionModal;
