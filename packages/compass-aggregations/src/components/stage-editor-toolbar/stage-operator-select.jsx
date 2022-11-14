import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';
import { filterStageOperators } from '../../utils/stage';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { Combobox, ComboboxOption, css, cx, spacing } from '@mongodb-js/compass-components';
import { isAtlasOnly } from '../../utils/stage';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

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
  const optionStyleByStageName = useMemo(() => {
    return Object.fromEntries(stages.map((stage) => [stage.name, comboboxOptionStyles(stage)]))
  }, [stages])

  return <Combobox value={selectedStage}
    aria-label="Select a stage operator"
    onChange={onChange}
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

export default connect(
  (state, ownProps) => {
    const stages = filterStageOperators({
      serverVersion: state.serverVersion,
      env: state.env,
      isTimeSeries: state.isTimeSeries,
      isReadonly: state.isReadonly,
      sourceName: state.sourceName
    });
    const pipeline = state.pipelineBuilder.stageEditor.stages;
    const stage = pipeline[ownProps.index];
    return {
      stages,
      selectedStage: stage.stageOperator,
      isDisabled: stage.disabled,
      num_stages: pipeline.length,
    };
  },
  { changeStageOperator },
  (stateProps, dispatchProps, ownProps) => {
    const { num_stages, ...restOfStateProps } = stateProps;
    const { changeStageOperator } = dispatchProps;
    const { index } = ownProps;
    return {
      ...restOfStateProps,
      ...ownProps,
      onChange: (name) => {
        track('Aggregation Edited', {
          num_stages,
          stage_action: 'stage_renamed',
          stage_name: name,
          editor_view_type: 'stage', // Its always stage view for this component
        });
        changeStageOperator(index, name);
      },
    };
  }
)(StageOperatorSelect);
