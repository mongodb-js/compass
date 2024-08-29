import React from 'react';
import {
  Icon,
  Button,
  css,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';

type ExpandAllDocumentsButtonProps = {
  onClick: () => void;
};

const hiddenOnNarrowStyles = css({
  [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < 900px)`]:
    {
      display: 'none',
    },
});

const ExpandAllDocumentsButton: React.FunctionComponent<
  ExpandAllDocumentsButtonProps
> = ({ onClick }) => {
  return (
    <Button
      value="Expand all documents"
      size="xsmall"
      onClick={onClick}
      leftGlyph={<Icon glyph="Edit"></Icon>}
      data-testid="crud-update"
    >
      <span className={hiddenOnNarrowStyles}>Expand All</span>
    </Button>
  );
};

export default ExpandAllDocumentsButton;
