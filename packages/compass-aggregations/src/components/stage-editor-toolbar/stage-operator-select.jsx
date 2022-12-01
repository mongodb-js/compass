import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';
import { filterStageOperators } from '../../utils/stage';

import { Combobox, ComboboxOption, css, cx, spacing } from '@mongodb-js/compass-components';
import { isAtlasOnly } from '../../utils/stage';
import _ from 'lodash';
import { usePreference } from 'compass-preferences-model';

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

function comboboxOptionStyles(stage) {
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

export const StageOperatorSelect = ({
  onChange,
  index,
  selectedStage,
  stages
}) => {
  const onStageOperatorSelected = useCallback((name) => {
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

StageOperatorSelect.propTypes = {
  index: PropTypes.number.isRequired,
  stages: PropTypes.array.isRequired,
  selectedStage: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
};

function EnvAwareStageOperatorSelect({
  envInfo: { serverVersion, env, isTimeSeries, isReadonly, sourceName },
  stage,
  onChange,
  index
}) {
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

  return <StageOperatorSelect
    index={index}
    stages={stages}
    selectedStage={stage.stageOperator}
    isDisabled={stage.disabled}
    onChange={onChange}
    />
}

EnvAwareStageOperatorSelect.propTypes = {
  index: PropTypes.number.isRequired,
  envInfo: PropTypes.object.isRequired,
  stage: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default connect(
  (state, ownProps) => {
    return {
      envInfo: _.pick(state, ['serverVersion', 'env', 'isTimeSeries', 'isReadonly', 'sourceName']),
      stage: state.pipelineBuilder.stageEditor.stages[ownProps.index]
    };
  },
  { onChange: changeStageOperator }
)(EnvAwareStageOperatorSelect);
