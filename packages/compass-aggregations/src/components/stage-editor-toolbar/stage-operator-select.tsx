import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { usePreference } from 'compass-preferences-model';
import { connect } from 'react-redux';

import { Combobox, ComboboxOption, css, cx, spacing } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';

import { filterStageOperators } from '../../utils/stage';
import { isAtlasOnly } from '../../utils/stage';


const inputWidth = spacing[7] * 2;
const descriptionWidth = spacing[5] * 14;
const stageNameWidth = spacing[4] * 8;
const dropdownWidth = stageNameWidth + descriptionWidth;

const comboboxStyles = css({
  marginLeft: spacing[2],
  width: inputWidth,
  '& [role="combobox"]': {
    height: spacing[4] - 2 // match other xs controls
  }
});

function comboboxOptionStyles(stage: { env: string, description: string}) {
  return css({
    '&::after': {
      content: JSON.stringify(
        (isAtlasOnly(stage.env) ? 'Atlas only. ' : '') +
        stage.description),
      width: descriptionWidth
    },
  });
}

const portalStyles = css({
  '> div': {
    width: dropdownWidth,
    marginLeft: (dropdownWidth / 2) - (inputWidth / 2) // realigns the dropdown with the input
  },
});

type StageOperatorSelectProps = {
  onChange: (index: number, name: string|null) => void,
  index: number,
  selectedStage: string | null,
  stages: {
      name: string,
      env: string,
      description: string
  }[]
};

const StageOperatorSelect = ({
  onChange,
  index,
  selectedStage,
  stages
}: StageOperatorSelectProps) => {
  const onStageOperatorSelected = useCallback((name: string|null) => {
    onChange(index, name);
  }, [onChange, index]);

  const optionStyleByStageName = useMemo(() => {
    return Object.fromEntries(stages.map((stage) => [stage.name, comboboxOptionStyles(stage)]))
  }, [stages])

  return <Combobox value={selectedStage}
    aria-label="Select a stage operator"
    onChange={onStageOperatorSelected}
    size="default"
    clearable={false}
    data-testid="stage-operator-combobox"
    className={comboboxStyles}
    // @ts-expect-error According to leafygreen the type of portalClassName should be undefined
    portalClassName={cx(
      portalStyles,
      // used for testing since at the moment is not possible to identify
      // the listbox container or the single ComboboxOptions with testIds
      `mongodb-compass-stage-operator-combobox-portal-${index}`
    )}>
      {stages.map((stage, index) => <ComboboxOption
          data-testid={`combobox-option-stage-${stage.name}`}
          key={`combobox-option-stage-${index}`}
          value={stage.name}
          className={optionStyleByStageName[stage.name]}
          displayName={stage.name} />
      )}
  </Combobox>;
};

type EnvAwareStageOperatorSelectProps = {
  envInfo: {
    serverVersion: string,
    env: string,
    isTimeSeries: boolean,
    isReadonly: boolean,
    sourceName: string
  },
  stage: {
    stageOperator: string | null,
    disabled: boolean
  },
  onChange: (index: number, name: string) => void,
  index: number
};
function EnvAwareStageOperatorSelect({
  envInfo: { serverVersion, env, isTimeSeries, isReadonly, sourceName },
  stage,
  onChange,
  index
}: EnvAwareStageOperatorSelectProps) {
  const preferencesReadOnly = usePreference('readOnly', React);
  const stages = useMemo(() => {
    return filterStageOperators({
      serverVersion,
      env,
      isTimeSeries,
      isReadonly,
      preferencesReadOnly,
      sourceName
    });
  }, [serverVersion, env, isTimeSeries, isReadonly, preferencesReadOnly, sourceName])

  const onChangeFilter = (index: number, name: string|null) => {
    if (name) {
      onChange(index, name);
    }
  }

  return <StageOperatorSelect
    index={index}
    stages={stages}
    selectedStage={stage.stageOperator}
    onChange={onChangeFilter}
    />
}

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    return {
      envInfo: _.pick(state, ['serverVersion', 'env', 'isTimeSeries', 'isReadonly', 'sourceName']),
      stage: state.pipelineBuilder.stageEditor.stages[ownProps.index]
    };
  },
  { onChange: changeStageOperator }
)(EnvAwareStageOperatorSelect);
