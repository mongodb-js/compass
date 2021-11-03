import { css } from '@emotion/css';
import React, { useEffect, useRef, useReducer } from 'react';
import {
  IconButton,
  Icon,
  Menu,
  MenuItem,
  Toast,
  ToastVariant,
  spacing,
} from '@mongodb-js/compass-components';

const dropdownButtonStyles = css({
  color: 'white',
  position: 'absolute',
  right: spacing[1],
  top: spacing[2],
  marginTop: spacing[1],
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
  toastVariant: ToastVariant.Success | ToastVariant.Warning;
  toastOpen: boolean;
};

const defaultToastState: State = {
  error: '',
  toastOpen: false,
  toastVariant: ToastVariant.Success,
};

type Action =
  | { type: 'show-success-toast' }
  | { type: 'show-warning-toast'; error }
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
}: {
  connectionString: string;
}): React.ReactElement {
  const [{ error, toastOpen, toastVariant }, dispatch] = useReducer(reducer, {
    ...defaultToastState,
  });
  const toastHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      dispatch({
        type: 'show-warning-toast',
        error: err,
      });
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
            className={dropdownButtonStyles}
            aria-label="Connection Options Menu"
          >
            <Icon glyph="VerticalEllipsis" />
          </IconButton>
        }
      >
        <MenuItem onClick={() => copyConnectionString(connectionString)}>
          Copy Connection String
        </MenuItem>
      </Menu>
    </>
  );
}

export default ConnectionMenu;
