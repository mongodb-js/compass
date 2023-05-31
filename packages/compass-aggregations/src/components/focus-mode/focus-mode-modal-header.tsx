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
  useHotkeys,
  formatHotkey,
  useGuideCue,
} from '@mongodb-js/compass-components';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import {
  addStageInFocusMode,
  selectFocusModeStage,
} from '../../modules/focus-mode';
import { changeStageDisabled } from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';

type Stage = {
  idxInStore: number;
  stageOperator: string | null;
};

type FocusModeModalHeaderProps = {
  stageIndex: number;
  isEnabled: boolean;
  stages: Stage[];
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
    whiteSpace: 'nowrap',
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

const PREVIOUS_STAGE_HOTKEY = 'meta+shift+9';
const NEXT_STAGE_HOTKEY = 'meta+shift+0';
const ADD_STAGE_AFTER_HOTKEY = 'meta+shift+a';
const ADD_STAGE_BEFORE_HOTKEY = 'meta+shift+b';

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

  const intersectingRef = React.useRef<HTMLDivElement | null>(null);

  const { refEl: ref1 } = useGuideCue({
    id: 'Previous',
    groupId: 'FocusMode',
    title: 'Navigate between stages',
    content: <p>Goto previous stage</p>,
    intersectingRef,
  });

  const { refEl: ref2 } = useGuideCue({
    id: 'Select Stage',
    groupId: 'FocusMode',
    title: 'Navigate between stages',
    content: <p>Stage dropdow</p>,
    intersectingRef,
  });

  const { refEl: ref3 } = useGuideCue({
    id: 'Next',
    groupId: 'FocusMode',
    title: 'Navigate between stages',
    content: <p>Goto next stage</p>,
    intersectingRef,
  });

  const { refEl: ref4 } = useGuideCue({
    id: 'Toggle',
    groupId: 'FocusMode',
    title: 'Toggle stage',
    content: <p>Toggle stage</p>,
    intersectingRef,
  });

  const { refEl: ref5 } = useGuideCue({
    id: 'Add Stage',
    groupId: 'FocusMode',
    title: 'Add stages',
    content: <p>Add stage after or before</p>,
    intersectingRef,
  });

  const isFirst = stages[0].idxInStore === stageIndex;
  const isLast = stages[stages.length - 1].idxInStore === stageIndex;

  const onPreviousStage = () => {
    if (isFirst) {
      return;
    }

    const idx = stages.findIndex((stage) => stage.idxInStore === stageIndex);
    const prevStageIdx = stages[idx - 1].idxInStore;
    onStageSelect(prevStageIdx);
  };

  const onNextStage = () => {
    if (isLast) {
      return;
    }

    const idx = stages.findIndex((stage) => stage.idxInStore === stageIndex);
    const nextStageIdx = stages[idx + 1].idxInStore;
    onStageSelect(nextStageIdx);
  };

  const onAddStageBefore = () => {
    onAddStageClick(stageIndex - 1);
    setMenuOpen(false);
  };

  const onAddStageAfter = () => {
    onAddStageClick(stageIndex);
    setMenuOpen(false);
  };

  useHotkeys(PREVIOUS_STAGE_HOTKEY, onPreviousStage);
  useHotkeys(NEXT_STAGE_HOTKEY, onNextStage);
  useHotkeys(ADD_STAGE_AFTER_HOTKEY, onAddStageAfter);
  useHotkeys(ADD_STAGE_BEFORE_HOTKEY, onAddStageBefore);

  const stageSelectLabels = stages.map(
    ({ stageOperator, idxInStore }, index) => {
      return {
        label: `Stage ${index + 1}: ${stageOperator ?? 'select'}`,
        value: idxInStore,
      };
    }
  );

  const stageSelectStyle = {
    width: `calc(${String(
      Math.max(
        ...stageSelectLabels.map(({ label }) => {
          return label.length;
        })
      )
    )}ch + ${spacing[5]}px)`,
  };

  return (
    <div ref={intersectingRef} className={controlsContainerStyles}>
      <div className={controlContainerStyles}>
        <Tooltip
          isDisabled={isFirst}
          trigger={({ children, ...props }) => (
            <span {...props}>
              {children}
              <Button
                ref={ref1}
                size="xsmall"
                disabled={isFirst}
                onClick={onPreviousStage}
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
            </span>
          )}
        >
          <Body className={tooltipContentStyles}>
            <span className={tooltipContentItemStyles}>
              Go to previous stage
            </span>
            <span className={tooltipContentItemStyles}>
              {formatHotkey(PREVIOUS_STAGE_HOTKEY)}
            </span>
          </Body>
        </Tooltip>
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
          ref={ref2}
        >
          {stageSelectLabels.map(({ label, value }) => {
            return (
              <Option key={label} value={String(value)}>
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
                ref={ref3}
                size="xsmall"
                disabled={isLast}
                onClick={onNextStage}
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
            </span>
          )}
        >
          <Body className={tooltipContentStyles}>
            <span>Go to next stage</span>
            <span className={tooltipContentItemStyles}>
              {formatHotkey(NEXT_STAGE_HOTKEY)}
            </span>
          </Body>
        </Tooltip>
      </div>

      <div ref={ref4} className={controlContainerStyles}>
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
        className={menuStyles}
        open={menuOpen}
        setOpen={setMenuOpen}
        trigger={({ onClick, children }: any) => {
          return (
            <div className={controlContainerStyles}>
              <Button
                ref={ref5}
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
          onClick={onAddStageAfter}
          data-hotkey={formatHotkey(ADD_STAGE_AFTER_HOTKEY)}
        >
          Add stage after
        </MenuItem>
        <MenuItem
          className={menuItemStyles}
          onClick={onAddStageBefore}
          data-hotkey={formatHotkey(ADD_STAGE_BEFORE_HOTKEY)}
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
    const stage = stages[stageIndex] as StoreStage;

    return {
      stageIndex,
      isEnabled: !stage?.disabled,
      stages: stages.reduce<Stage[]>((accumulator, stage, idxInStore) => {
        if (stage.type === 'stage') {
          accumulator.push({
            idxInStore,
            stageOperator: stage.stageOperator,
          });
        }
        return accumulator;
      }, []),
    };
  },
  {
    onStageSelect: selectFocusModeStage,
    onStageDisabledToggleClick: changeStageDisabled,
    onAddStageClick: addStageInFocusMode,
  }
)(FocusModeModalHeader);
