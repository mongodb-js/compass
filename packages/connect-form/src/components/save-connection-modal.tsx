import React, { useState } from 'react';
import {
  ConfirmationModal,
  Label,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import {
  ConnectionInfo,
  ConnectionFavoriteOptions,
} from 'mongodb-data-service';

import FormFieldContainer from './form-field-container';
import SavedConnectionColorPicker from './saved-connection-color-picker';

const connectionNameInputStyles = css({
  marginTop: spacing[5],
});

function SaveConnectionModal({
  initialConnectionInfo,
  onCancel,
  onSave,
  open,
}: {
  initialConnectionInfo: ConnectionInfo;
  onCancel: () => void;
  onSave: (favoriteInfo: ConnectionFavoriteOptions) => Promise<void>;
  open: boolean;
}): React.ReactElement {
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
        void onSave({
          ...initialConnectionInfo.favorite,
          ...editingFavorite,
        });
      }}
      onCancel={onCancel}
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
        <Label htmlFor="">Read Preference</Label>
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
