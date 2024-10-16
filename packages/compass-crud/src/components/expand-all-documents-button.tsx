import React from 'react';
import {
  Icon,
  Button,
  css,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';

type ExpandAllDocumentsButtonProps = {
  allDocumentsExpanded: boolean;
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
> = ({ allDocumentsExpanded, onClick }) => {
  const buttonText = allDocumentsExpanded ? 'Collapse' : 'Expand';

  return (
    <Button
      value={`${buttonText} all documents`}
      size="xsmall"
      onClick={onClick}
      leftGlyph={<Icon glyph="Edit"></Icon>}
      data-testid="expand-all-documents-button"
    >
      <span className={hiddenOnNarrowStyles}>{buttonText} All</span>
    </Button>
  );
};

export default ExpandAllDocumentsButton;
