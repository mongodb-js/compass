import { css, cx } from '@emotion/css';
import React, { ChangeEvent, Fragment, useRef, useReducer } from 'react';
import {
  Icon,
  IconButton,
  Label,
  TextArea,
  spacing,
} from '@mongodb-js/compass-components';
import ConfirmEditConnectionString from './confirm-edit-connection-string';
import ConnectionStringUrl from 'mongodb-connection-string-url';

const labelStyles = css({
  padding: 0,
  margin: 0,
  marginTop: spacing[3],
});

const infoButtonStyles = css({
  verticalAlign: 'middle',
  marginTop: -spacing[1],
});

const connectionStringEditDisabled = css({
  textarea: {
    paddingRight: spacing[5],
  },
});

const textAreaContainerStyle = css({
  position: 'relative',
});

const editConnectionStringStyles = css({
  position: 'absolute',
  right: spacing[1],
  top: spacing[1],
});

const connectionStringStyles = css({
  textarea: {
    minHeight: spacing[7],
    resize: 'vertical',
  },
});

const connectionStringInputId = 'connectionString';

type State = {
  enableEditingConnectionString: boolean;
  showConfirmEditConnectionStringPrompt: boolean;
};

type Action =
  | { type: 'enable-editing-connection-string' }
  | { type: 'show-edit-connection-string-confirmation' }
  | { type: 'hide-edit-connection-string-confirmation' };

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
      <Label className={labelStyles} htmlFor={connectionStringInputId}>
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
      <div className={textAreaContainerStyle}>
        <TextArea
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            setConnectionString(event.target.value);
          }}
          value={displayedConnectionString}
          className={cx(
            connectionStringStyles,
            enableEditingConnectionString ? null : connectionStringEditDisabled
          )}
          disabled={!enableEditingConnectionString}
          id={connectionStringInputId}
          ref={textAreaEl}
          aria-labelledby="Connection String"
          placeholder="e.g mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin"
        />
        {!enableEditingConnectionString && (
          <IconButton
            className={editConnectionStringStyles}
            aria-label="Edit Connection String"
            data-testid="enableEditConnectionStringButton"
            onClick={() =>
              dispatch({
                type: 'show-edit-connection-string-confirmation',
              })
            }
          >
            <Icon glyph="Edit" size="small" />
          </IconButton>
        )}
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
