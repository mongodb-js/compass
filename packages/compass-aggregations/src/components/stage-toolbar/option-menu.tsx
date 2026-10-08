import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  Menu,
  IconButton,
  Icon,
  useTranslation,
} from '@mongodb-js/compass-components';
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
  const t = useTranslation();
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
              aria-label={t('aggregations.stageMenu.options', 'Options')}
              title={t('aggregations.stageMenu.options', 'Options')}
            >
              <Icon glyph="Ellipsis" size="small"></Icon>
            </IconButton>
            {children}
          </>
        );
      }}
    >
      <OptionMenuItem
        label={t('aggregations.stageMenu.addAfter', 'Add stage after')}
        icon="PlusWithCircle"
        onClick={() => onAddStageClick(index)}
        setMenuOpen={setMenuOpen}
      />
      <OptionMenuItem
        label={t('aggregations.stageMenu.addBefore', 'Add stage before')}
        icon="PlusWithCircle"
        onClick={() => onAddStageClick(index - 1)}
        setMenuOpen={setMenuOpen}
      />
      <OptionMenuItem
        label={t('aggregations.stageMenu.delete', 'Delete stage')}
        icon="Trash"
        onClick={() => onDeleteStageClick(index)}
        setMenuOpen={setMenuOpen}
      />
      <OptionMenuItem
        label={t('aggregations.stageMenu.expandDocuments', 'Expand documents')}
        icon="ChevronDown"
        onClick={() => onExpand(index)}
        setMenuOpen={setMenuOpen}
      />
      <OptionMenuItem
        label={t(
          'aggregations.stageMenu.collapseDocuments',
          'Collapse documents'
        )}
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
