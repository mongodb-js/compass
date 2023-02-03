import {
  Button,
  css,
  Icon,
  Menu,
  MenuItem,
  Option,
  Select,
  spacing,
  Toggle,
} from '@mongodb-js/compass-components';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import {
  addStageInFocusMode,
  selectFocusModeStage,
} from '../../modules/focus-mode';
import { changeStageDisabled } from '../../modules/pipeline-builder/stage-editor';

type FocusModeModalHeaderProps = {
  stageIndex: number;
  isEnabled: boolean;
  stages: (string | null)[];
  onStageSelect: (index: number) => void;
  onStageDisabledToggleClick: (index: number, newVal: boolean) => void;
  onAddStageClick: (index: number) => void;
};

const controlsContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[3],
});

const controlContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const fakeToggleLabelStyles = css({
  textTransform: 'uppercase',
  fontWeight: 'bold',
  width: `${String(
    Math.max(...['Enabled', 'Disabled'].map((label) => label.length))
  )}ch`,
});

const menuItemStyles = css({
  '&:after': {
    content: 'attr(data-hotkey)',
  },
});

export const FocusModeModalHeader: React.FunctionComponent<
  FocusModeModalHeaderProps
> = ({
  stageIndex,
  isEnabled,
  stages,
  onAddStageClick,
  onStageSelect,
  onStageDisabledToggleClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isFirst = stageIndex === 0;
  const isLast = stages.length - 1 === stageIndex;
  const stageSelectLabels = stages.map((stageName, index) => {
    return `Stage ${index + 1}: ${stageName ?? 'select'}`;
  });
  const stageSelectStyle = {
    width: `calc(${String(
      Math.max(
        ...stageSelectLabels.map((label) => {
          return label.length;
        })
      )
    )}ch + ${spacing[5]}px)`,
  };

  return (
    <div className={controlsContainerStyles}>
      <div className={controlContainerStyles}>
        <Button
          size="xsmall"
          disabled={isFirst}
          onClick={() => {
            onStageSelect(stageIndex - 1);
          }}
          data-testid="previous-stage-button"
          aria-label="Edit previous stage"
        >
          <Icon
            size="xsmall"
            title={null}
            role="presentation"
            glyph="ChevronLeft"
          ></Icon>
        </Button>

        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <Select
          data-testid="stage-select"
          allowDeselect={false}
          style={stageSelectStyle}
          size="xsmall"
          value={String(stageIndex)}
          aria-label="Select stage to edit"
          onChange={(newVal: string) => {
            onStageSelect(Number(newVal));
          }}
        >
          {stageSelectLabels.map((label, index) => {
            return (
              <Option key={label} value={String(index)}>
                {label}
              </Option>
            );
          })}
        </Select>

        <Button
          size="xsmall"
          disabled={isLast}
          onClick={() => {
            onStageSelect(stageIndex + 1);
          }}
          aria-label="Edit next stage"
          data-testid="next-stage-button"
        >
          <Icon
            size="xsmall"
            title={null}
            role="presentation"
            glyph="ChevronRight"
          ></Icon>
        </Button>
      </div>

      <div className={controlContainerStyles}>
        <span aria-hidden="true" className={fakeToggleLabelStyles}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
        <Toggle
          size="xsmall"
          aria-label={isEnabled ? 'Disable stage' : 'Enable stage'}
          checked={isEnabled}
          onChange={(checked) => {
            onStageDisabledToggleClick(stageIndex, !checked);
          }}
        />
      </div>

      <Menu
        data-testid="add-stage-menu-content"
        open={menuOpen}
        setOpen={setMenuOpen}
        trigger={({ onClick, children }: any) => {
          return (
            <div className={controlContainerStyles}>
              <Button
                data-testid="add-stage-menu-button"
                size="xsmall"
                leftGlyph={
                  <Icon
                    title={null}
                    role="presentation"
                    glyph="PlusWithCircle"
                  ></Icon>
                }
                rightGlyph={
                  <Icon
                    title={null}
                    role="presentation"
                    glyph="CaretDown"
                  ></Icon>
                }
                onClick={onClick}
              >
                Add stage
              </Button>
              {children}
            </div>
          );
        }}
      >
        <MenuItem
          className={menuItemStyles}
          data-hotkey="A+"
          onClick={() => {
            onAddStageClick(stageIndex);
            setMenuOpen(false);
          }}
        >
          Add stage after
        </MenuItem>
        <MenuItem
          className={menuItemStyles}
          data-hotkey="B+"
          onClick={() => {
            onAddStageClick(stageIndex - 1);
            setMenuOpen(false);
          }}
        >
          Add stage before
        </MenuItem>
      </Menu>
    </div>
  );
};

export default connect(
  (state: RootState) => {
    const {
      focusMode: { stageIndex },
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = state;
    const stage = stages[stageIndex];
    return {
      stageIndex,
      isEnabled: !stage?.disabled,
      stages: stages.map((stage) => {
        return stage.stageOperator;
      }),
    };
  },
  {
    onStageSelect: selectFocusModeStage,
    onStageDisabledToggleClick: changeStageDisabled,
    onAddStageClick: addStageInFocusMode,
  }
)(FocusModeModalHeader);
