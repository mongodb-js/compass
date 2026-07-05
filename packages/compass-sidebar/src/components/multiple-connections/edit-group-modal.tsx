import React, { useState } from 'react';
import {
  FormModal,
  TextInput,
  Select,
  Option,
  useSyncStateOnPropChange,
} from '@mongodb-js/compass-components';
import {
  ColorCircleGlyph,
  useConnectionColor,
} from '@mongodb-js/connection-form';

export type EditGroupModalProps = {
  isOpen: boolean;
  group: { id: string; name: string; color?: string } | null;
  onSubmit: (values: { name: string; color?: string }) => void;
  onClose: () => void;
};

const NO_COLOR_VALUE = 'no-color';

const EditGroupModal: React.FunctionComponent<EditGroupModalProps> = ({
  isOpen,
  group,
  onSubmit,
  onClose,
}) => {
  const { connectionColorCodes, connectionColorToHex, connectionColorToName } =
    useConnectionColor();

  const [name, setName] = useState(group?.name ?? '');
  const [color, setColor] = useState(group?.color);

  useSyncStateOnPropChange(() => {
    setName(group?.name ?? '');
    setColor(group?.color);
  }, [group]);

  const isSubmitDisabled = !name;

  const onSubmitForm = () => {
    if (!isSubmitDisabled) {
      onSubmit({ name, color });
    }
  };

  return (
    <FormModal
      open={isOpen}
      onCancel={onClose}
      onSubmit={onSubmitForm}
      submitButtonText="Save"
      submitDisabled={isSubmitDisabled}
      title="Edit group"
      data-testid="edit-group-modal"
    >
      <TextInput
        label="Name"
        data-testid="edit-group-name-input"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
      />
      <Select
        label="Color"
        data-testid="edit-group-color-input"
        value={color ?? NO_COLOR_VALUE}
        allowDeselect={false}
        onChange={(value) => {
          setColor(value === NO_COLOR_VALUE ? undefined : value);
        }}
      >
        <Option
          glyph={<ColorCircleGlyph hexColor="transparent" />}
          value={NO_COLOR_VALUE}
        >
          No Color
        </Option>
        {connectionColorCodes().map((colorCode) => (
          <Option
            key={colorCode}
            glyph={
              <ColorCircleGlyph hexColor={connectionColorToHex(colorCode)} />
            }
            value={colorCode}
          >
            {connectionColorToName(colorCode)}
          </Option>
        ))}
      </Select>
    </FormModal>
  );
};

export default EditGroupModal;
