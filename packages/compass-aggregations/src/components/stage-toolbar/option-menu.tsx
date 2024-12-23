import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Menu, IconButton, Icon } from '@mongodb-js/compass-components';
import {
  addStage,
  removeStage,
  expandPreviewDocsForStage,
  collapsePreviewDocsForStage,
} from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../modules';
import { OptionMenuItem } from './option-menu-item';

export const OptionMenu = ({
  index,
  onAddStageClick,
  onDeleteStageClick,
  onExpand,
  onCollapse,
}: {
  index: number;
  onAddStageClick: (index: number) => void;
  onDeleteStageClick: (index: number) => void;
  onExpand: (stageIdx: number) => void;
  onCollapse: (stageIdx: number) => void;
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
              aria-label="Options"
              title="Options"
            >
              <Icon glyph="Ellipsis" size="small"></Icon>
            </IconButton>
            {children}
          </>
        );
      }}
    >
      <OptionMenuItem
        label="Add stage after"
        icon="PlusWithCircle"
        onClick={() => onAddStageClick(index)}
        setMenuOpen={setMenuOpen}
      />
      <OptionMenuItem
        label="Add stage before"
        icon="PlusWithCircle"
        onClick={() => onAddStageClick(index - 1)}
        setMenuOpen={setMenuOpen}
      />
      <OptionMenuItem
        label="Delete stage"
        icon="Trash"
        onClick={() => onDeleteStageClick(index)}
        setMenuOpen={setMenuOpen}
      />
      <OptionMenuItem
        label="Expand documents"
        icon="ChevronDown"
        onClick={() => onExpand(index)}
        setMenuOpen={setMenuOpen}
      />
      <OptionMenuItem
        label="Collapse documents"
        icon="ChevronUp"
        onClick={() => onCollapse(index)}
        setMenuOpen={setMenuOpen}
      />
    </Menu>
  );
};

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    const stage = state.pipelineBuilder.stageEditor.stages[
      ownProps.index
    ] as StoreStage;
    return {
      isExpanded: !stage.collapsed,
    };
  },
  {
    onAddStageClick: addStage,
    onDeleteStageClick: removeStage,
    onExpand: expandPreviewDocsForStage,
    onCollapse: collapsePreviewDocsForStage,
  }
)(OptionMenu);
