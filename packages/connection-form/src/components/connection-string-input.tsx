import type { ChangeEvent } from 'react';
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
  position: 'relative',
  marginBottom: spacing[2],
});

const uriLabelContainerStyles = css({
  flexGrow: 1,
});

const connectionStringStyles = css({
  textarea: {
    minHeight: spacing[7],
    resize: 'vertical',
  },
});

const editToggleStyles = css({
  height: 14,
  width: 26,
  margin: spacing[1],
  marginRight: 0,
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
}: {
  connectionString: string;
  enableEditingConnectionString: boolean;
  setEnableEditingConnectionString: (enableEditing: boolean) => void;
  updateConnectionFormField: UpdateConnectionFormField;
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

  const onChangeConnectionString = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
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
        <label
          className={editToggleLabelStyles}
          id="edit-connection-string-label"
          htmlFor="toggle-edit-connection-string"
        >
          Edit Connection String
        </label>
        <Toggle
          className={editToggleStyles}
          id="toggle-edit-connection-string"
          aria-labelledby="edit-connection-string-label"
          size="xsmall"
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
          value={displayedConnectionString}
          className={connectionStringStyles}
          disabled={!enableEditingConnectionString}
          id={connectionStringInputId}
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
