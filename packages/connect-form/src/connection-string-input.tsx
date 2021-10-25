/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { ChangeEvent, Fragment, useRef, useState, useEffect } from 'react';
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
  openLink,
  connectionString,
  setConnectionString,
}: {
  connectionString: string;
  openLink: (url: string) => void;
  setConnectionString: (connectionString: string) => void;
}): React.ReactElement {
  // If there is a connection string default it to protected.
  const [isEditingShowCreds, setIsEditingShowCreds] = useState(
    !connectionString
  );
  const [
    needsToConfirmEditConnectionString,
    setNeedsToConfirmEditConnectionString,
  ] = useState(false);

  // TODO: Is this something we want? Might want to add extra checks
  // that value doesn't change.
  // TODO: Put this in a better place not use effect?
  useEffect(() => {
    if (isEditingShowCreds) {
      // Wait for the modal focus trap to disappear.
      setTimeout(() => {
        // Focus the connection string input when change to editing mode.
        textAreaEl.current?.focus();
      }, 200);
    }
  }, [isEditingShowCreds]);

  const textAreaEl = useRef<HTMLTextAreaElement>(null);

  const displayedConnectionString = isEditingShowCreds
    ? connectionString
    : hidePasswordInConnectionString(connectionString);

  return (
    <Fragment>
      <Label css={labelStyles} htmlFor={connectionStringInputId}>
        Connection String
        <IconButton
          css={infoButtonStyles}
          aria-label="Connection String Documentation"
          data-testid="connectionStringDocsButton"
          onClick={() => {
            openLink(
              'https://docs.mongodb.com/manual/reference/connection-string/'
            );
          }}
        >
          <Icon glyph="InfoWithCircle" size="small" />
        </IconButton>
      </Label>
      <div css={textAreaContainerStyle}>
        <TextArea
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            setConnectionString(event.target.value);
          }}
          value={displayedConnectionString}
          css={[
            connectionStringStyles,
            isEditingShowCreds ? null : connectionStringEditDisabled,
          ]}
          disabled={!isEditingShowCreds}
          id={connectionStringInputId}
          ref={textAreaEl}
          aria-labelledby="Connection String"
          placeholder="e.g mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin"
        />
        {!isEditingShowCreds && (
          <IconButton
            css={editConnectionStringStyles}
            aria-label="Edit Connection String"
            data-testid="enableEditConnectionStringButton"
            onClick={() => setNeedsToConfirmEditConnectionString(true)}
          >
            <Icon glyph="Edit" size="small" />
          </IconButton>
        )}
        <ConfirmEditConnectionString
          open={needsToConfirmEditConnectionString}
          onClose={() => setNeedsToConfirmEditConnectionString(false)}
          onConfirm={() => {
            // TODO: Add a reducer for this?
            setNeedsToConfirmEditConnectionString(false);
            setIsEditingShowCreds(true);

            // Wait for the modal focus trap to disappear.
            setTimeout(() => {
              // Focus the connection string input when change to editing mode.
              textAreaEl.current?.focus();
            }, 200);
          }}
        />
      </div>
    </Fragment>
  );
}

export default ConnectStringInput;
