import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';
import { filterStageOperators } from '../../utils/stage';

import { Combobox, ComboboxOption, css, cx, LeafyGreenProvider, spacing, useScrollbars } from '@mongodb-js/compass-components';
import { isAtlasOnly } from '../../utils/stage';
import _ from 'lodash';
import { usePreference } from 'compass-preferences-model';

const inputWidth = spacing[7] * 2;
const descriptionWidth = spacing[5] * 14;
const stageNameWidth = spacing[4] * 8;
const dropdownWidth = stageNameWidth + descriptionWidth;

const inputHeight = spacing[4] - 2; // match other xs controls
const comboboxStyles = css({
  marginLeft: spacing[2],
  marginRight: spacing[2],
  width: inputWidth,
  '& [role="combobox"]': {
    padding: 0,
    paddingLeft: spacing[1],
    height: inputHeight,
    '& > div': {
      minHeight: inputHeight,
    },
    '& input': {
      height: inputHeight - 2
    }
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
  const {
    className: scrollbarStyles
  } = useScrollbars();

  const onStageOperatorSelected = useCallback((name) => {
    onChange(index, name);
  }, [onChange, index]);

  const optionStyleByStageName = useMemo(() => {
    return Object.fromEntries(stages.map((stage) => [stage.name, comboboxOptionStyles(stage)]))
  }, [stages]);

  return (
    <LeafyGreenProvider
      popoverPortalContainer={{
        // We style the combobox option container to fit the atypical width
        // to accommodate the stage descriptions.
        // To apply these styles we need to apply them to the portal container
        // of the combobox options.
        // Because Compass uses the `popoverPortalContainer` from LeafyGreen in home.tsx
        // we here need to unset the provided `portalContainer` so that we can
        // ensure the styles are applied to the combobox options by not using Compass' popover portal.
        portalContainer: undefined,
      }}
    >
      <Combobox value={selectedStage}
        aria-label="Select a stage operator"
        onChange={onStageOperatorSelected}
        size="default"
        clearable={false}
        data-testid="stage-operator-combobox"
        className={comboboxStyles}
        portalClassName={cx(
          scrollbarStyles,
          portalStyles,
          // used for testing since at the moment is not possible to identify
          // the listbox container or the single ComboboxOptions with testIds
          `mongodb-compass-stage-operator-combobox-portal-${index}`
        )}
      >
        {stages.map((stage, index) => <ComboboxOption
            data-testid={`combobox-option-stage-${stage.name}`}
            key={`combobox-option-stage-${index}`}
            value={stage.name}
            className={optionStyleByStageName[stage.name]}
            displayName={stage.name}
          />
        )}
      </Combobox>
    </LeafyGreenProvider>
  );
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

  return (
    <StageOperatorSelect
      index={index}
      stages={stages}
      selectedStage={stage.stageOperator}
      isDisabled={stage.disabled}
      onChange={onChange}
    />
  );
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
