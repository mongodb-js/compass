import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { usePreference } from 'compass-preferences-model';
import { connect } from 'react-redux';
import { type AceEditor } from '@mongodb-js/compass-editor';

import {
  Combobox,
  ComboboxOption,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';

import { filterStageOperators } from '../../utils/stage';
import { isAtlasOnly } from '../../utils/stage';

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
    '& input': {
      height: inputHeight - 2,
    },
  },
});

type StageOperatorSelectProps = {
  onChange: (index: number, name: string | null) => void;
  index: number;
  selectedStage: string | null;
  isDisabled: boolean;
  stages: {
    name: string;
    env: string;
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

  return (
    <Combobox
      value={selectedStage}
      disabled={isDisabled}
      aria-label="Select a stage operator"
      onChange={onStageOperatorSelected}
      size="default"
      clearable={false}
      data-testid="stage-operator-combobox"
      className={comboboxStyles}
      // Used for testing to access the popover for a stage
      popoverClassName={`mongodb-compass-stage-operator-combobox-${index}`}
    >
      {stages.map((stage, index) => (
        <ComboboxOption
          data-testid={`combobox-option-stage-${stage.name}`}
          key={`combobox-option-stage-${index}`}
          value={stage.name}
          displayName={stage.name}
          description={
            (isAtlasOnly(stage.env) ? 'Atlas only. ' : '') + stage.description
          }
        />
      ))}
    </Combobox>
  );
};

type EnvAwareStageOperatorSelectProps = {
  envInfo: {
    serverVersion: string;
    env: string;
    isTimeSeries: boolean;
    sourceName: string;
  };
  stage: {
    stageOperator: string | null;
    disabled: boolean;
  };
  onChange: (index: number, name: string) => void;
  index: number;
  editorRef: React.RefObject<AceEditor | undefined>;
};
function EnvAwareStageOperatorSelect({
  envInfo: { serverVersion, env, isTimeSeries, sourceName },
  stage,
  onChange,
  index,
  editorRef,
}: EnvAwareStageOperatorSelectProps) {
  const preferencesReadOnly = usePreference('readOnly', React);
  const stages = useMemo(() => {
    return filterStageOperators({
      serverVersion,
      env,
      isTimeSeries,
      preferencesReadOnly,
      sourceName,
    });
  }, [serverVersion, env, isTimeSeries, preferencesReadOnly, sourceName]);

  const onChangeFilter = (index: number, name: string | null) => {
    if (name) {
      onChange(index, name);
      editorRef.current?.focus();
    }
  };

  return (
    <StageOperatorSelect
      index={index}
      stages={stages}
      selectedStage={stage.stageOperator}
      isDisabled={stage.disabled}
      onChange={onChangeFilter}
    />
  );
}

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    return {
      envInfo: _.pick(state, [
        'serverVersion',
        'env',
        'isTimeSeries',
        'sourceName',
      ]),
      stage: state.pipelineBuilder.stageEditor.stages[ownProps.index],
    };
  },
  { onChange: changeStageOperator }
)(EnvAwareStageOperatorSelect);
