import { css } from '@emotion/css';
import React, { useReducer } from 'react';
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
  bottom: 0,
});

const toastStyles = css({
  button: {
    position: 'absolute',
  },
});

type State = {
  toastVariant: ToastVariant.Success | ToastVariant.Warning;
  error: string;
  toastOpen: boolean;
};

const defaultToastState: State = {
  toastOpen: false,
  toastVariant: ToastVariant.Success,
  error: '',
};

type Action =
  | { type: 'show-success-toast' }
  | { type: 'show-warning-toast'; error }
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
  }

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
