import { css } from '@emotion/css';
import React, { ChangeEvent, Fragment, useRef, useReducer } from 'react';
import {
  Icon,
  IconButton,
  Label,
  TextArea,
  Toggle,
  spacing,
} from '@mongodb-js/compass-components';
import ConfirmEditConnectionString from './confirm-edit-connection-string';
import { redactConnectionString } from 'mongodb-connection-string-url';

const uriLabelStyles = css({
  padding: 0,
  margin: 0,
  flexGrow: 1,
});

const infoButtonStyles = css({
  verticalAlign: 'middle',
  marginTop: -spacing[1],
});

const textAreaContainerStyle = css({
  position: 'relative',
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

type State = {
  enableEditingConnectionString: boolean;
  showConfirmEditConnectionStringPrompt: boolean;
};

type Action =
  | { type: 'enable-editing-connection-string' }
  | { type: 'show-edit-connection-string-confirmation' }
  | { type: 'hide-edit-connection-string-confirmation' }
  | { type: 'hide-connection-string' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'enable-editing-connection-string':
      return {
        ...state,
        showConfirmEditConnectionStringPrompt: false,
        enableEditingConnectionString: true,
      };
    case 'show-edit-connection-string-confirmation':
      return {
        ...state,
        showConfirmEditConnectionStringPrompt: true,
      };
    case 'hide-connection-string':
      return {
        ...state,
        showConfirmEditConnectionStringPrompt: false,
        enableEditingConnectionString: false,
      };
    case 'hide-edit-connection-string-confirmation':
      return {
        ...state,
        showConfirmEditConnectionStringPrompt: false,
      };
    default:
      return state;
  }
}

export function hidePasswordInConnectionString(
  connectionString: string
): string {
  return redactConnectionString(connectionString).replace(
    /<credentials>/g,
    '*****'
  );
}

function ConnectStringInput({
  connectionString,
  setConnectionString,
}: {
  connectionString: string;
  setConnectionString: (connectionString: string) => void;
}): React.ReactElement {
  const [
    { enableEditingConnectionString, showConfirmEditConnectionStringPrompt },
    dispatch,
  ] = useReducer(reducer, {
    // If there is a connection string default it to protected.
    enableEditingConnectionString: !connectionString,
    showConfirmEditConnectionStringPrompt: false,
  });

  const textAreaEl = useRef<HTMLTextAreaElement>(null);

  const displayedConnectionString = enableEditingConnectionString
    ? connectionString
    : hidePasswordInConnectionString(connectionString);

  return (
    <Fragment>
      <div className={textAreaLabelContainerStyles}>
        <Label className={uriLabelStyles} htmlFor={connectionStringInputId}>
          Connection String
          <IconButton
            className={infoButtonStyles}
            aria-label="Connection String Documentation"
            data-testid="connectionStringDocsButton"
            href="https://docs.mongodb.com/manual/reference/connection-string/"
            target="_blank"
          >
            <Icon glyph="InfoWithCircle" size="small" />
          </IconButton>
        </Label>
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
          onClick={() => {
            if (enableEditingConnectionString) {
              dispatch({
                type: 'hide-connection-string',
              });
              return;
            }
            dispatch({
              type: 'show-edit-connection-string-confirmation',
            });
          }}
        />
      </div>
      <div className={textAreaContainerStyle}>
        <TextArea
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            setConnectionString(event.target.value);
          }}
          value={displayedConnectionString}
          className={connectionStringStyles}
          disabled={!enableEditingConnectionString}
          id={connectionStringInputId}
          ref={textAreaEl}
          aria-labelledby="Connection String"
          placeholder="e.g mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin"
        />
        <ConfirmEditConnectionString
          open={showConfirmEditConnectionStringPrompt}
          onCancel={() =>
            dispatch({
              type: 'hide-edit-connection-string-confirmation',
            })
          }
          onConfirm={() =>
            dispatch({
              type: 'enable-editing-connection-string',
            })
          }
        />
      </div>
    </Fragment>
  );
}

export default ConnectStringInput;
