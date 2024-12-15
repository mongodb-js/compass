import React, { useMemo, useState } from 'react';
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
  expandPreviewDocsForStage,
  collapsePreviewDocsForStage,
} from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
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

  const menuItems = useMemo(() => {
    return [
      {
        label: 'Add stage after',
        onClick: () => {
          onAddStageClick(index);
          setMenuOpen(false);
        },
        icon: 'PlusWithCircle',
      },
      {
        label: 'Add stage before',
        onClick: () => {
          onAddStageClick(index - 1);
          setMenuOpen(false);
        },
        icon: 'PlusWithCircle',
      },
      {
        label: 'Delete stage',
        onClick: () => {
          onDeleteStageClick(index);
          setMenuOpen(false);
        },
        icon: 'Trash',
      },
      {
        label: 'Expand documents',
        onClick: () => {
          onExpand(index);
          setMenuOpen(false);
        },
        icon: 'ChevronDown',
      },
      {
        label: 'Collapse documents',
        onClick: () => {
          onCollapse(index);
          setMenuOpen(false);
        },
        icon: 'ChevronUp',
      },
    ];
  }, [index, onAddStageClick, onDeleteStageClick, onExpand, onCollapse]);

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
      {menuItems.map((item) => (
        <MenuItem
          key={item.label}
          data-text={item.label}
          onClick={item.onClick}
        >
          <div className={menuItemStyles}>
            <Icon color={palette.gray.dark2} glyph={item.icon} size="small" />
            {item.label}
          </div>
        </MenuItem>
      ))}
      <MenuItem
        onClick={() => {
          onCollapse(index);
          setMenuOpen(false);
        }}
      >
        <div className={menuItemStyles}>
          <Icon color={palette.gray.dark2} glyph="ChevronUp" size="small" />
          Collapse documents
        </div>
      </MenuItem>
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
