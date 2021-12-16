import { css, cx } from '@emotion/css';
import React, { useEffect, useRef, useReducer } from 'react';
import {
  IconButton,
  Icon,
  Menu,
  MenuItem,
  Toast,
  ToastVariant,
  spacing,
  uiColors
} from '@mongodb-js/compass-components';

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
  isActive,
}: {
  connectionString: string;
  isActive: boolean;
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

  const iconStyles = css({
    color: isActive ? uiColors.gray.dark3 : uiColors.white,
  });

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
              iconStyles,
            )}
            aria-label="Connection Options Menu"
          >
            <Icon glyph="Ellipsis" />
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
