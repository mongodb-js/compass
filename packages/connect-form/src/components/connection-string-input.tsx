import { css } from '@emotion/css';
import React, {
  ChangeEvent,
  Fragment,
  useRef,
  useReducer,
  useEffect,
} from 'react';
import {
  Icon,
  IconButton,
  Label,
  TextArea,
  Toggle,
  spacing,
} from '@mongodb-js/compass-components';
import ConfirmEditConnectionString from './confirm-edit-connection-string';
import ConnectionStringUrl from 'mongodb-connection-string-url';

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
  marginBottom: spacing[2],
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

function connectionStringHasValidScheme(connectionString: string) {
  return (
    connectionString.startsWith('mongodb://') ||
    connectionString.startsWith('mongodb+srv://')
  );
}

type State = {
  editingConnectionString: string;
  enableEditingConnectionString: boolean;
  showConfirmEditConnectionStringPrompt: boolean;
};

type Action =
  | { type: 'enable-editing-connection-string' }
  | {
      type: 'set-editing-connection-string';
      editingConnectionString: string;
    }
  | { type: 'show-edit-connection-string-confirmation' }
  | { type: 'hide-edit-connection-string-confirmation' }
  | { type: 'hide-connection-string' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set-editing-connection-string':
      return {
        ...state,
        editingConnectionString: action.editingConnectionString,
      };
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
  try {
    const passwordHiddenConnectionString = new ConnectionStringUrl(
      connectionString
    );

    if (passwordHiddenConnectionString.password) {
      passwordHiddenConnectionString.password = '*****';
    }
    if (passwordHiddenConnectionString.searchParams.get('AWS_SESSION_TOKEN')) {
      passwordHiddenConnectionString.searchParams.set(
        'AWS_SESSION_TOKEN',
        '*****'
      );
    }

    return passwordHiddenConnectionString.toString();
  } catch (e) {
    // If we cannot parse the connection string we'll return it
    // as could be misformed.
    return connectionString;
  }
}

function ConnectStringInput({
  connectionString,
  setConnectionStringError,
  setConnectionStringUrl,
}: {
  connectionString?: string;
  setConnectionStringError: (errorMessage: string | null) => void;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  const textAreaEl = useRef<HTMLTextAreaElement>(null);

  const [
    {
      editingConnectionString,
      enableEditingConnectionString,
      showConfirmEditConnectionStringPrompt,
    },
    dispatch,
  ] = useReducer(reducer, {
    // If there is a connection string default it to protected.
    enableEditingConnectionString:
      !connectionString || connectionString === 'mongodb://localhost:27017/',
    showConfirmEditConnectionStringPrompt: false,
    editingConnectionString: connectionString || '',
  });

  useEffect(() => {
    // If the user isn't actively editing the connection string and it
    // changes (form action) we update the string and disable editing.
    if (
      editingConnectionString !== connectionString &&
      (!textAreaEl.current || textAreaEl.current !== document.activeElement)
    ) {
      dispatch({
        type: 'set-editing-connection-string',
        editingConnectionString: connectionString || '',
      });
      dispatch({
        type: 'hide-connection-string',
      });
    }
  }, [
    connectionString,
    enableEditingConnectionString,
    editingConnectionString,
  ]);

  function onChangeConnectionString(event: ChangeEvent<HTMLTextAreaElement>) {
    const newConnectionString = event.target.value;

    dispatch({
      type: 'set-editing-connection-string',
      editingConnectionString: newConnectionString,
    });

    try {
      // Ensure it's parsable connection string.
      const connectionStringUrl = new ConnectionStringUrl(newConnectionString);
      setConnectionStringUrl(connectionStringUrl);
    } catch (error) {
      // Check if starts with url scheme.
      if (!connectionStringHasValidScheme(newConnectionString)) {
        setConnectionStringError(
          'Invalid schema, expected connection string to start with `mongodb://` or `mongodb+srv://`'
        );
        return;
      }

      setConnectionStringError((error as Error).message);
    }
  }

  const displayedConnectionString = enableEditingConnectionString
    ? editingConnectionString
    : hidePasswordInConnectionString(editingConnectionString);

  return (
    <Fragment>
      <div className={textAreaLabelContainerStyles}>
        <Label className={uriLabelStyles} htmlFor={connectionStringInputId}>
          URI
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
          onChange={onChangeConnectionString}
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
