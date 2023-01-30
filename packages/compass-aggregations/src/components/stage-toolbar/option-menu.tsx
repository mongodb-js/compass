import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  Menu,
  MenuItem,
  css,
  IconButton,
  Icon,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import {
  addStage,
  removeStage,
} from '../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../modules';

const menuItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

export const OptionMenu = ({
  index,
  onAddStageClick,
  onDeleteStageClick,
}: {
  index: number;
  onAddStageClick: (index: number) => void;
  onDeleteStageClick: (index: number) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Menu
      open={menuOpen}
      setOpen={setMenuOpen}
      data-testid="stage-option-menu-content"
      trigger={({ onClick, children }: any) => {
        return (
          <>
            <IconButton
              data-testid="stage-option-menu-button"
              onClick={onClick}
              aria-label="More options"
            >
              <Icon glyph="Ellipsis" size="small"></Icon>
            </IconButton>
            {children}
          </>
        );
      }}
    >
      <MenuItem
        onClick={() => {
          onAddStageClick(index);
          setMenuOpen(false);
        }}
      >
        <div className={menuItemStyles}>
          <Icon
            color={palette.gray.dark2}
            glyph="PlusWithCircle"
            size="small"
          />
          Add stage after
        </div>
      </MenuItem>
      <MenuItem
        onClick={() => {
          onAddStageClick(index - 1);
          setMenuOpen(false);
        }}
      >
        <div className={menuItemStyles}>
          <Icon
            color={palette.gray.dark2}
            glyph="PlusWithCircle"
            size="small"
          />
          Add stage before
        </div>
      </MenuItem>
      <MenuItem
        onClick={() => {
          onDeleteStageClick(index);
          setMenuOpen(false);
        }}
      >
        <div className={menuItemStyles}>
          <Icon color={palette.gray.dark2} glyph="Trash" size="small" />
          Delete stage
        </div>
      </MenuItem>
    </Menu>
  );
};

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    return {
      isExpanded:
        !state.pipelineBuilder.stageEditor.stages[ownProps.index].collapsed,
    };
  },
  {
    onAddStageClick: addStage,
    onDeleteStageClick: removeStage,
  }
)(OptionMenu);
