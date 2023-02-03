import {
  Body,
  Button,
  css,
  Icon,
  Menu,
  MenuItem,
  Option,
  Select,
  spacing,
  Toggle,
  Tooltip,
} from '@mongodb-js/compass-components';
import React, { useEffect, useState } from 'react';
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

const menuStyles = css({
  width: '240px',
});

const menuItemStyles = css({
  '&:after': {
    content: 'attr(data-hotkey)',
    position: 'absolute',
    right: 20, // LG has 20px padding on the right
  },
});

const tooltipContentStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[3],
});

const tooltipContentItemStyles = css({
  flexShrink: 0,
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

  const keyEventListener = (e: KeyboardEvent) => {
    const isShiftKey = e.shiftKey;
    const isCtrlOrMetaKey = e.ctrlKey || e.metaKey;
    if (!isShiftKey || !isCtrlOrMetaKey) {
      return;
    }

    switch (e.key) {
      case '9':
        return onPreviousStage();
      case '0':
        return onNextStage();
      case 'a':
        return onAddStageAfter();
      case 'b':
        return onAddStageBefore();
      default:
        return;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', keyEventListener);
    return () => {
      window.removeEventListener('keydown', keyEventListener);
    };
  }, [keyEventListener]);

  const isFirst = stageIndex === 0;
  const isLast = stages.length - 1 === stageIndex;

  const onPreviousStage = () => {
    if (isFirst) {
      return;
    }
    onStageSelect(stageIndex - 1);
  };

  const onNextStage = () => {
    if (isLast) {
      return;
    }
    onStageSelect(stageIndex + 1);
  };

  const onAddStageBefore = () => {
    onAddStageClick(stageIndex - 1);
    setMenuOpen(false);
  };

  const onAddStageAfter = () => {
    onAddStageClick(stageIndex);
    setMenuOpen(false);
  };

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
        <Tooltip
          isDisabled={isFirst}
          trigger={({ children, ...props }) => (
            <span {...props}>
              {children}
              <Button
                size="xsmall"
                disabled={isFirst}
                onClick={onPreviousStage}
                aria-label="Edit previous stage"
              >
                <Icon
                  size="xsmall"
                  title={null}
                  role="presentation"
                  glyph="ChevronLeft"
                ></Icon>
              </Button>
            </span>
          )}
        >
          <Body className={tooltipContentStyles}>
            <span className={tooltipContentItemStyles}>
              Go to previous stage
            </span>
            <span className={tooltipContentItemStyles}>Ctrl + Shift + 9</span>
          </Body>
        </Tooltip>
        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <Select
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

        <Tooltip
          isDisabled={isLast}
          trigger={({ children, ...props }) => (
            <span {...props}>
              {children}
              <Button
                size="xsmall"
                disabled={isLast}
                onClick={onNextStage}
                aria-label="Edit next stage"
              >
                <Icon
                  size="xsmall"
                  title={null}
                  role="presentation"
                  glyph="ChevronRight"
                ></Icon>
              </Button>
            </span>
          )}
        >
          <Body className={tooltipContentStyles}>
            <span>Go to next stage</span>
            <span>Ctrl + Shift + 0</span>
          </Body>
        </Tooltip>
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
        className={menuStyles}
        open={menuOpen}
        setOpen={setMenuOpen}
        trigger={({ onClick, children }: any) => {
          return (
            <div className={controlContainerStyles}>
              <Button
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
          onClick={onAddStageAfter}
          data-hotkey="Ctrl + Shift + A"
        >
          Add stage after
        </MenuItem>
        <MenuItem
          className={menuItemStyles}
          onClick={onAddStageBefore}
          data-hotkey="Ctrl + Shift + B"
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
