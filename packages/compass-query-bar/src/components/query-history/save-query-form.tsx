import React, { forwardRef, useState } from 'react';
import {
  Button,
  Label,
  TextInput,
  css,
  spacing,
  useId,
} from '@mongodb-js/compass-components';

const formStyles = css({
  display: 'flex',
});

const labelStyles = css({
  display: 'none',
});

const textInputStyles = css({
  flex: 1,
});

const submitButtonStyles = css({
  marginLeft: '6px', // spacing[1] makes the shadows overlap, spacing[2] is too much
  marginRight: spacing[1],
});

type SaveQueryFormProps = {
  onSave: (name: string) => void;
  onCancel: () => void;
};

export const SaveQueryForm = forwardRef<HTMLFormElement, SaveQueryFormProps>(
  ({ onSave, onCancel }, ref) => {
    const [name, setName] = useState<string>('');
    const labelId = useId();
    const controlId = useId();
    return (
      <form
        data-testid="query-history-favorite-form"
        ref={ref}
        className={formStyles}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(name);
        }}
      >
        <Label id={labelId} htmlFor={controlId} className={labelStyles} />
        <TextInput
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={true}
          placeholder="Favorite Name"
          className={textInputStyles}
          id={controlId}
          aria-labelledby={labelId}
          onChange={(event) => {
            setName(event.target.value);
          }}
          data-testid="recent-query-save-favorite-name"
        />
        <Button
          data-testid="recent-query-save-favorite-submit"
          className={submitButtonStyles}
          type="submit"
          variant="primary"
        >
          Save
        </Button>
        <Button
          data-testid="recent-query-save-favorite-cancel"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </form>
    );
  }
);

SaveQueryForm.displayName = 'SaveQueryForm';
