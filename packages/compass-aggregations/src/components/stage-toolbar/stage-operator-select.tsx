import React, { useCallback } from 'react';
import { withPreferences } from 'compass-preferences-model/provider';
import { connect } from 'react-redux';

import {
  Combobox,
  ComboboxOption,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';

import { filterStageOperators } from '../../utils/stage';
import { isAtlasOnly } from '../../utils/stage';
import type { ServerEnvironment } from '../../modules/env';

const inputWidth = spacing[7] * 2;

const inputHeight = spacing[4] - 2; // match other xs controls
const comboboxStyles = css({
  width: inputWidth,
  '& [role="combobox"]': {
    padding: 0,
    paddingLeft: spacing[1],
    height: inputHeight,
    '& > div': {
      minHeight: inputHeight,
    },
  },
});

// width of options popover
const comboxboxOptionsWidth = 500;
// left position of options popover wrt input. this aligns it with the start of input
const comboboxOptionsLeft = (comboxboxOptionsWidth - inputWidth) / 2;
const comboboxPortalStyles = css({
  position: 'fixed',
  top: 0,
  // -4px to count for the input focus outline.
  left: `${comboboxOptionsLeft - 4}px`,
  zIndex: 1,
  width: '400px',
  '> div': {
    width: comboxboxOptionsWidth,
    whiteSpace: 'normal',
  },
});

type StageOperatorSelectProps = {
  onChange: (index: number, name: string | null, snippet?: string) => void;
  index: number;
  selectedStage: string | null;
  isDisabled: boolean;
  stages: {
    name: string;
    env: ServerEnvironment[];
    description: string;
  }[];
};

// exported for tests
export const StageOperatorSelect = ({
  onChange,
  index,
  selectedStage,
  isDisabled,
  stages,
}: StageOperatorSelectProps) => {
  const onStageOperatorSelected = useCallback(
    (name: string | null) => {
      onChange(index, name);
    },
    [onChange, index]
  );
  const portalRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <React.Fragment>
      <div className={comboboxPortalStyles} ref={portalRef} />
      <Combobox
        value={selectedStage}
        disabled={isDisabled}
        aria-label="Select a stage operator"
        onChange={onStageOperatorSelected}
        size="default"
        clearable={false}
        data-testid="stage-operator-combobox"
        className={comboboxStyles}
        portalContainer={portalRef.current}
        usePortal
      >
        {stages.map((stage, index) => (
          <ComboboxOption
            data-testid={`combobox-option-stage-${stage.name}`}
            key={`combobox-option-stage-${index}`}
            value={stage.name}
            description={
              (isAtlasOnly(stage.env) ? 'Atlas only. ' : '') + stage.description
            }
          />
        ))}
      </Combobox>
    </React.Fragment>
  );
};

export default withPreferences(
  connect(
    (
      state: RootState,
      ownProps: {
        index: number;
        readOnly: boolean;
        onChange?: (
          index: number,
          name: string | null,
          snippet?: string
        ) => void;
      }
    ) => {
      const stage = state.pipelineBuilder.stageEditor.stages[
        ownProps.index
      ] as StoreStage;

      const stages = filterStageOperators({
        serverVersion: state.serverVersion,
        env: state.env,
        isTimeSeries: state.isTimeSeries,
        sourceName: state.sourceName,
        preferencesReadOnly: ownProps.readOnly,
      });
      return {
        selectedStage: stage.stageOperator,
        isDisabled: stage.disabled,
        stages: stages,
      };
    },
    (dispatch: any, ownProps) => {
      return {
        onChange(index: number, name: string | null) {
          const snippet = dispatch(changeStageOperator(index, name ?? ''));
          ownProps.onChange?.(index, name, snippet);
        },
      };
    }
  )(StageOperatorSelect),
  ['readOnly']
);
