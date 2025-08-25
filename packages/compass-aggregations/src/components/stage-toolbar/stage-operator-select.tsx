import React, { useCallback } from 'react';
import {
  usePreference,
  withPreferences,
} from 'compass-preferences-model/provider';
import { connect } from 'react-redux';
import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';

import {
  Combobox,
  ComboboxOption,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';

import { filterStageOperators, isSearchStage } from '../../utils/stage';
import { isAtlasOnly } from '../../utils/stage';
import type { ServerEnvironment } from '../../modules/env';
import type { CollectionStats } from '../../modules/collection-stats';

const inputWidth = spacing[1400] * 3;
// width of options popover
const comboxboxOptionsWidth = spacing[1200] * 10;
// left position of options popover wrt input. this aligns it with the start of input
const comboboxOptionsLeft = (comboxboxOptionsWidth - inputWidth) / 2;

const comboboxStyles = css({
  width: inputWidth,
  '> :popover-open': {
    width: comboxboxOptionsWidth,
    whiteSpace: 'normal',
    // -4px to count for the input focus outline.
    marginLeft: `${comboboxOptionsLeft - 4}px`,
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
  serverVersion: string;
  isReadonlyView: boolean;
  collectionStats: CollectionStats;
};

type Stage = {
  name: string;
  env: ServerEnvironment[];
  description: string;
};

export const getStageDescription = (
  stage: Stage,
  isReadonlyView: boolean,
  versionIncompatibleCompass: boolean,
  isPipelineSearchQueryable: boolean
) => {
  if (isReadonlyView && isSearchStage(stage.name)) {
    const minMajorMinorVersion =
      VIEW_PIPELINE_UTILS.MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_COMPASS.split(
        '.'
      )
        .slice(0, 2)
        .join('.');
    if (versionIncompatibleCompass) {
      return (
        `Atlas only. Requires MongoDB ${minMajorMinorVersion}+ to run on a view. ` +
        stage.description
      );
    }

    if (!isPipelineSearchQueryable) {
      return (
        `Atlas only. Only views containing $addFields, $set or $match stages with the $expr operator are compatible with search indexes. ` +
        stage.description
      );
    }
  }
  return (isAtlasOnly(stage.env) ? 'Atlas only. ' : '') + stage.description;
};

// exported for tests
export const StageOperatorSelect = ({
  onChange,
  index,
  selectedStage,
  isDisabled,
  serverVersion,
  isReadonlyView,
  collectionStats,
  stages,
}: StageOperatorSelectProps) => {
  const onStageOperatorSelected = useCallback(
    (name: string | null) => {
      onChange(index, name);
    },
    [onChange, index]
  );

  const enableAtlasSearchIndexes = usePreference('enableAtlasSearchIndexes');
  const versionIncompatibleCompass =
    enableAtlasSearchIndexes &&
    !VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
      serverVersion
    );

  const pipelineIsSearchQueryable = collectionStats?.pipeline
    ? VIEW_PIPELINE_UTILS.isPipelineSearchQueryable(
        collectionStats.pipeline as Document[]
      )
    : true;
  const disableSearchStage =
    isReadonlyView &&
    (!pipelineIsSearchQueryable || versionIncompatibleCompass);

  return (
    <Combobox
      value={selectedStage}
      disabled={isDisabled}
      aria-label="Select a stage operator"
      onChange={onStageOperatorSelected}
      size="xsmall"
      clearable={false}
      data-testid="stage-operator-combobox"
      className={comboboxStyles}
    >
      {stages.map((stage: Stage, index) => (
        <ComboboxOption
          data-testid={`combobox-option-stage-${stage.name}`}
          key={`combobox-option-stage-${index}`}
          value={stage.name}
          disabled={isSearchStage(stage.name) && disableSearchStage}
          description={getStageDescription(
            stage,
            isReadonlyView,
            versionIncompatibleCompass,
            pipelineIsSearchQueryable
          )}
        />
      ))}
    </Combobox>
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
        serverVersion: state.serverVersion,
        isReadonlyView: !!state.sourceName,
        collectionStats: state.collectionStats,
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
