import React, { useState } from 'react';
import {
  FormModal,
  FormFieldContainer,
  TextInput,
} from '@mongodb-js/compass-components';
import type { ConnectionFavoriteOptions } from '@mongodb-js/connection-storage/renderer';

import { FavoriteColorPicker } from './favorite-color-picker';

function SaveConnectionModal({
  initialFavoriteInfo,
  onCancelClicked,
  onSaveClicked,
  open,
  saveText = 'Save',
}: {
  initialFavoriteInfo?: ConnectionFavoriteOptions;
  onCancelClicked: () => void;
  onSaveClicked: (favoriteInfo: ConnectionFavoriteOptions) => Promise<void>;
  open: boolean;
  saveText?: string;
}): React.ReactElement {
  const [editingFavorite, setEditingFavorite] = useState({
    name: '',
    ...initialFavoriteInfo,
  });

  return (
    <FormModal
      title={
        initialFavoriteInfo ? 'Edit favorite' : 'Save connection to favorites'
      }
      open={open}
      onSubmit={() => {
        void onSaveClicked({
          ...editingFavorite,
        });
      }}
      submitDisabled={(editingFavorite.name || '').trim() ? false : true}
      onCancel={onCancelClicked}
      submitButtonText={saveText}
      data-testid="favorite-modal"
    >
      <FormFieldContainer>
        <TextInput
          data-testid="favorite-name-input"
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
        <FavoriteColorPicker
          colorCode={editingFavorite.color}
          onChange={(newColor?: string) => {
            setEditingFavorite({
              ...editingFavorite,
              color: newColor,
            });
          }}
        />
      </FormFieldContainer>
    </FormModal>
  );
}

export default SaveConnectionModal;
