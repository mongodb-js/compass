import React, { useState } from 'react';
import {
  IconButton,
  Icon,
  Menu,
  MenuItem,
  ToastVariant,
  spacing,
  css,
  cx,
  useToast,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from 'mongodb-data-service';
const dropdownButtonStyles = css({
  position: 'absolute',
  right: spacing[1],
  top: 0,
  margin: 'auto 0',
  bottom: 0,
});

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

function ConnectionMenu({
  connectionString,
  iconColor,
  connectionInfo,
  duplicateConnection,
  removeConnection,
}: {
  connectionString: string;
  iconColor: string;
  connectionInfo: ConnectionInfo;
  duplicateConnection: (connectionInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
}): React.ReactElement {
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  const { openToast } = useToast('compass-connections');

  async function copyConnectionString(connectionString: string) {
    try {
      await navigator.clipboard.writeText(connectionString);
      openToast('copy-to-clipboard', {
        title: 'Success',
        body: 'Copied to clipboard.',
        variant: ToastVariant.Success,
        timeout: TOAST_TIMEOUT_MS,
      });
    } catch (err) {
      openToast('copy-to-clipboard', {
        title: 'Error',
        body: 'An error occurred when copying to clipboard. Please try again.',
        variant: ToastVariant.Warning,
        timeout: TOAST_TIMEOUT_MS,
      });
    }
  }

  return (
    <>
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
        <MenuItem
          onClick={async () => {
            await copyConnectionString(connectionString);
            setMenuIsOpen(false);
          }}
        >
          Copy Connection String
        </MenuItem>
        {connectionInfo.favorite && (
          <MenuItem
            onClick={() => {
              duplicateConnection(connectionInfo);
              setMenuIsOpen(false);
            }}
          >
            Duplicate
          </MenuItem>
        )}
        <MenuItem onClick={() => removeConnection(connectionInfo)}>
          Remove
        </MenuItem>
      </Menu>
    </>
  );
}

export default ConnectionMenu;
