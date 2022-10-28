import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';
import { filterStageOperators } from '../../utils/stage';

import { Combobox, ComboboxOption, css, spacing } from '@mongodb-js/compass-components';
import { isAtlasOnly } from '../../utils/stage';

const inputWidth = spacing[7] * 2;
const descriptionWidth = spacing[5] * 10;
const stageNameWidth = spacing[4] * 8;

const comboboxStyles = css({
  marginLeft: spacing[2],
  width: inputWidth,
  '& [role="combobox"]': {
    height: spacing[4] - 2 // match with xs controls
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
    width: stageNameWidth + descriptionWidth,
    left: descriptionWidth + spacing[2] // realigns the dropdown with the input
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
    portalClassName={portalStyles}>
      {stages.map((stage, index) => <ComboboxOption
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

export default connect(
  (state, ownProps) => {
    const stages = filterStageOperators({
      serverVersion: state.serverVersion,
      env: state.env,
      isTimeSeries: state.isTimeSeries,
      isReadonly: state.isReadonly,
      sourceName: state.sourceName
    })
    const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
    return {
      stages,
      selectedStage: stage.stageOperator,
      isDisabled: stage.disabled
    };
  },
  { onChange: changeStageOperator }
)(StageOperatorSelect);
