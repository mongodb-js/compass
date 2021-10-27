/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  IconButton,
  Icon,
  Menu,
  MenuItem,
  spacing,
} from '@mongodb-js/compass-components';

const dropdownButtonStyles = css({
  color: 'white',
  position: 'absolute',
  right: spacing[1],
  top: spacing[2],
  bottom: 0,
});

function ConnectionMenu({
  onClickDuplicate,
  onClickRemove,
}: {
  onClickDuplicate: () => void;
  onClickRemove: () => void;
}): React.ReactElement {
  // ({ onClick, children }) => (
  // <button onClick={onClick}>
  //   Example Trigger
  //   {children}
  // </button>

  return (
    <Menu
      align="bottom"
      justify="start"
      trigger={
        <IconButton
          css={dropdownButtonStyles}
          aria-label="Connection Options Menu"
          // onClick={() => alert('open menu')}
        >
          {/* TODO: Is vertical okay? It's currently horizontal */}
          <Icon glyph="VerticalEllipsis" />
        </IconButton>
      }
    >
      <MenuItem onClick={onClickDuplicate}>Duplicate</MenuItem>
      <MenuItem onClick={onClickRemove}>Remove</MenuItem>
    </Menu>
  );
}

export default ConnectionMenu;
