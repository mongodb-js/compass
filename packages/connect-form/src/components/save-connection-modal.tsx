import React, { useState } from 'react';
import {
  ConfirmationModal,
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
  onCancelClicked,
  onSaveClicked,
  open,
}: {
  initialConnectionInfo: ConnectionInfo;
  onCancelClicked: () => void;
  onSaveClicked: (favoriteInfo: ConnectionFavoriteOptions) => Promise<void>;
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
