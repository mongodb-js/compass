import React, {
  Fragment,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  InlineInfoLink,
  Label,
  TextArea,
  Toggle,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import { redactConnectionString } from 'mongodb-connection-string-url';

import ConfirmEditConnectionString from './confirm-edit-connection-string';
import type { UpdateConnectionFormField } from '../hooks/use-connect-form';

const textAreaContainerStyle = css({
  marginTop: spacing[1],
  marginBottom: spacing[3],
});

const uriLabelContainerStyles = css({
  flexGrow: 1,
});

const connectionStringStyles = css({
  textarea: {
    fontSize: spacing[2] * 1.75,
    minHeight: spacing[7],
    resize: 'vertical',
  },
});

const editToggleStyles = css({
  height: 14,
  width: 26,
  margin: 0,
  marginLeft: spacing[1],
});

const editToggleLabelStyles = css({
  '&:hover': {
    cursor: 'pointer',
  },
});

const textAreaLabelContainerStyles = css({
  marginTop: spacing[3],
  display: 'flex',
  flexDirection: 'row',
});

const connectionStringInputId = 'connectionString';
const connectionStringLabelId = 'connectionStringLabel';

export function hidePasswordInConnectionString(
  connectionString: string
): string {
  return redactConnectionString(connectionString, {
    redactUsernames: false,
    replacementString: '*****',
  });
}

function ConnectStringInput({
  connectionString,
  enableEditingConnectionString,
  setEnableEditingConnectionString,
  updateConnectionFormField,
  onSubmit,
}: {
  connectionString: string;
  enableEditingConnectionString: boolean;
  setEnableEditingConnectionString: (enableEditing: boolean) => void;
  updateConnectionFormField: UpdateConnectionFormField;
  onSubmit: () => void;
}): React.ReactElement {
  const textAreaEl = useRef<HTMLTextAreaElement>(null);
  const [editingConnectionString, setEditingConnectionString] =
    useState(connectionString);
  const [showEditConnectionStringPrompt, setShowEditConnectionStringPrompt] =
    useState(false);

  useEffect(() => {
    // If the user isn't actively editing the connection string and it
    // changes (form action/new connection) we update the string.
    if (
      editingConnectionString !== connectionString &&
      (!textAreaEl.current || textAreaEl.current !== document.activeElement)
    ) {
      setEditingConnectionString(connectionString);
    }
  }, [
    connectionString,
    enableEditingConnectionString,
    editingConnectionString,
  ]);

  const onKeyPressedConnectionString = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Act like a text input - submit the form when enter is
      // pressed without shift.
      if (event.which === 13 && !event.shiftKey) {
        event.preventDefault();
        onSubmit();
        return;
      }
    },
    [onSubmit]
  );

  const onChangeConnectionString = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newConnectionString = event.target.value;

      setEditingConnectionString(newConnectionString);

      updateConnectionFormField({
        type: 'update-connection-string',
        newConnectionStringValue: newConnectionString,
      });
    },
    [updateConnectionFormField]
  );

  const displayedConnectionString = enableEditingConnectionString
    ? editingConnectionString
    : hidePasswordInConnectionString(editingConnectionString);

  return (
    <Fragment>
      <div className={textAreaLabelContainerStyles}>
        <div className={uriLabelContainerStyles}>
          <Label htmlFor={connectionStringInputId} id={connectionStringLabelId}>
            URI
          </Label>
          <InlineInfoLink
            aria-label="Connection String Documentation"
            data-testid="connectionStringDocsButton"
            href="https://docs.mongodb.com/manual/reference/connection-string/"
          />
        </div>
        <Label
          className={editToggleLabelStyles}
          id="edit-connection-string-label"
          htmlFor="toggle-edit-connection-string"
        >
          Edit Connection String
        </Label>
        <Toggle
          className={editToggleStyles}
          id="toggle-edit-connection-string"
          aria-labelledby="edit-connection-string-label"
          size="xsmall"
          type="button"
          checked={enableEditingConnectionString}
          onChange={(checked: boolean) => {
            if (checked) {
              setShowEditConnectionStringPrompt(true);
              return;
            }
            setEnableEditingConnectionString(false);
          }}
        />
      </div>
      <div className={textAreaContainerStyle}>
        <TextArea
          onChange={onChangeConnectionString}
          onKeyPress={onKeyPressedConnectionString}
          value={displayedConnectionString}
          className={connectionStringStyles}
          disabled={!enableEditingConnectionString}
          id={connectionStringInputId}
          data-testid={connectionStringInputId}
          ref={textAreaEl}
          aria-labelledby={connectionStringLabelId}
          placeholder="e.g mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin"
          spellCheck={false}
        />
        <ConfirmEditConnectionString
          open={showEditConnectionStringPrompt}
          onCancel={() => {
            setShowEditConnectionStringPrompt(false);
          }}
          onConfirm={() => {
            setEnableEditingConnectionString(true);

            setShowEditConnectionStringPrompt(false);
          }}
        />
      </div>
    </Fragment>
  );
}

export default ConnectStringInput;
