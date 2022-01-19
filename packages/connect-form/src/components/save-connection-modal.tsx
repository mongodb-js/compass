import React, { useState } from 'react';
import {
  ConfirmationModal,
  Label,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { ConnectionInfo } from 'mongodb-data-service';

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
  onSave: (connectionInfo: ConnectionInfo) => void;
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
        onSave({
          ...initialConnectionInfo,
          favorite: editingFavorite,
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
          name={'replica-set'}
          data-testid={'replica-set'}
          label={'Name'}
          type={'text'}
          optional={true}
          placeholder={'Test environment 3'}
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
