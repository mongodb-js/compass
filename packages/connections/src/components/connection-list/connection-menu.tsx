import React, { useEffect, useRef, useReducer, useState } from 'react';
import {
  IconButton,
  Icon,
  Menu,
  MenuItem,
  Toast,
  ToastVariant,
  spacing,
  css,
  cx,
} from '@mongodb-js/compass-components';
import { ConnectionInfo } from 'mongodb-data-service';
const dropdownButtonStyles = css({
  position: 'absolute',
  right: spacing[1],
  top: 0,
  margin: 'auto 0',
  bottom: 0,
});

const toastStyles = css({
  button: {
    position: 'absolute',
  },
});

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

type State = {
  error: string;
  toastVariant: ToastVariant;
  toastOpen: boolean;
};

const defaultToastState: State = {
  error: '',
  toastOpen: false,
  toastVariant: ToastVariant.Success,
};

type Action =
  | { type: 'show-success-toast' }
  | { type: 'show-warning-toast'; error: string }
  | { type: 'toast-timeout-started' }
  | { type: 'close-toast' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'show-success-toast':
      return {
        ...state,
        toastOpen: true,
        toastVariant: ToastVariant.Success,
        error: '',
      };
    case 'show-warning-toast':
      return {
        ...state,
        toastOpen: true,
        toastVariant: ToastVariant.Warning,
        error: action.error,
      };
    case 'close-toast':
      return {
        ...state,
        toastOpen: false,
      };
    default:
      return state;
  }
}

function ConnectionMenu({
  connectionString,
  iconColor,
  connectionInfo,
  duplicateConnection,
  removeConnection
}: {
  connectionString: string;
  iconColor: string;
  connectionInfo: ConnectionInfo;
  duplicateConnection: (connectionInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;

}): React.ReactElement {
  const [{ error, toastOpen, toastVariant }, dispatch] = useReducer(reducer, {
    ...defaultToastState,
  });
  const toastHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  function startToastHideTimeout() {
    if (toastHideTimeout.current) {
      // If we're currently showing a toast, cancel that previous timeout.
      clearTimeout(toastHideTimeout.current);
      toastHideTimeout.current = null;
    }

    toastHideTimeout.current = setTimeout(() => {
      dispatch({ type: 'close-toast' });
    }, TOAST_TIMEOUT_MS);
  }

  async function copyConnectionString(connectionString: string) {
    try {
      await navigator.clipboard.writeText(connectionString);
      dispatch({
        type: 'show-success-toast',
      });
    } catch (err) {
      if (err instanceof Error) {
        dispatch({
          type: 'show-warning-toast',
          error: err.message,
        });
      } else if (typeof err === 'string') {
        dispatch({
          type: 'show-warning-toast',
          error: err,
        });
      } else {
        dispatch({
          type: 'show-warning-toast',
          error:
            'An error occurred when copying to clipboard. Please try again.',
        });
      }
    }

    startToastHideTimeout();
  }

  useEffect(() => {
    return () => {
      // When we unmount, close the timeout if it exists.
      if (toastHideTimeout.current) {
        clearTimeout(toastHideTimeout.current);
        toastHideTimeout.current = null;
      }
    };
  }, []);

  return (
    <>
      <Toast
        className={toastStyles}
        variant={toastVariant}
        title={toastVariant === ToastVariant.Success ? 'Success!' : 'Error'}
        body={
          toastVariant === ToastVariant.Success
            ? 'Copied to clipboard.'
            : `${error}`
        }
        open={toastOpen}
        close={() => dispatch({ type: 'close-toast' })}
      />
      <Menu
        align="bottom"
        justify="start"
        trigger={
          <IconButton
            className={cx(
              dropdownButtonStyles,
              css({
                color: iconColor,
              })
            )}
            aria-label="Connection Options Menu"
          >
            <Icon glyph="Ellipsis" />
          </IconButton>
        }
        open={menuIsOpen}
        setOpen={setMenuIsOpen}
      >
        <MenuItem onClick={async () => { await copyConnectionString(connectionString); setMenuIsOpen(false)} }>
          Copy Connection String
        </MenuItem>
        { connectionInfo.favorite && 
          <MenuItem onClick={() => { duplicateConnection(connectionInfo); setMenuIsOpen(false )} }>
            Duplicate
          </MenuItem>
        }
        <MenuItem onClick={() => removeConnection(connectionInfo)}>
          Remove
        </MenuItem>
      </Menu>
    </>
  );
}

export default ConnectionMenu;
