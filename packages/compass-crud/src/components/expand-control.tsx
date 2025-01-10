import { Button, Icon, Menu, MenuItem } from '@mongodb-js/compass-components';
import React from 'react';

interface ExpandControlProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const ExpandControl: React.FunctionComponent<ExpandControlProps> = ({
  onExpandAll,
  onCollapseAll,
}) => {
  return (
    <Menu
      trigger={
        <Button
          size="xsmall"
          aria-label="Expand Controls"
          title="Expand Controls"
        >
          <Icon glyph="CaretDown" />
        </Button>
      }
    >
      <MenuItem onClick={onExpandAll}>Expand all documents</MenuItem>
      <MenuItem onClick={onCollapseAll}>Collapse all documents</MenuItem>
    </Menu>
  );
};

export default ExpandControl;
