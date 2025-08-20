import React, { useCallback } from 'react';
import {
  usePreference,
  withPreferences,
} from 'compass-preferences-model/provider';
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

import { filterStageOperators, isSearchStage } from '../../utils/stage';
import { isAtlasOnly } from '../../utils/stage';
import type { ServerEnvironment } from '../../modules/env';
import type { CollectionStats } from '../../modules/collection-stats';
import semver from 'semver'; //import from mongodb-js/constants

const inputWidth = spacing[1400] * 3;
// width of options popover
const comboxboxOptionsWidth = spacing[1200] * 10;
// left position of options popover wrt input. this aligns it with the start of input
const comboboxOptionsLeft = (comboxboxOptionsWidth - inputWidth) / 2;
const MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_DE = '8.0.0';
const isVersionSearchCompatibleForViewsDataExplorer = (
  serverVersion: string
) => {
  try {
    return semver.gte(
      serverVersion,
      MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_DE
    );
  } catch {
    return false;
  }
};

// START: ALL OF THESE WILL BE IMPORTED FROM mongodb-constants
const MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_COMPASS = '8.1.0';
const isVersionSearchCompatibleForViews = (serverVersion: string) => {
  try {
    return semver.gte(
      serverVersion,
      MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_COMPASS
    );
  } catch {
    return false;
  }
};

const isPipelineSearchQueryable = (
  //import from mongodb-js/constants
  pipeline: Array<Record<string, any>>
): boolean => {
  for (const stage of pipeline) {
    const stageKey = Object.keys(stage)[0];

    if (
      !(
        stageKey === '$addFields' ||
        stageKey === '$set' ||
        stageKey === '$match'
      )
    ) {
      return false;
    }

    if (stageKey === '$match') {
      const matchStage = stage['$match'];
      const allKeys = Object.keys(matchStage);

      if (!(allKeys.length === 1 && allKeys.includes('$expr'))) {
        return false; // Not searchable
      }
    }
  }

  return true;
};
// END: ALL OF THESE WILL BE IMPORTED FROM mongodb-constants

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
  versionIncompatibleDE: boolean,
  isPipelineSearchQueryable: boolean
) => {
  if (isReadonlyView && isSearchStage(stage.name)) {
    if (!isPipelineSearchQueryable) {
      return (
        `Atlas only. Only views containing $addFields, $set or $match stages with the $expr operator are compatible with search indexes.` +
        stage.description
      );
    }

    const minViewCompatibilityVersion = versionIncompatibleCompass
      ? MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_COMPASS
      : MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_DE;
    const minMajorMinorVersion = minViewCompatibilityVersion
      .split('.')
      .slice(0, 2)
      .join('.');
    if (versionIncompatibleCompass || versionIncompatibleDE) {
      return (
        `Atlas only. Requires MongoDB ${minMajorMinorVersion}+ to run on a view. ` +
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
    !isVersionSearchCompatibleForViews(serverVersion);
  const versionIncompatibleDE =
    !enableAtlasSearchIndexes &&
    !isVersionSearchCompatibleForViewsDataExplorer(serverVersion);
  const pipelineIsSearchQueryable = collectionStats?.pipeline
    ? isPipelineSearchQueryable(collectionStats.pipeline as Document[])
    : true;
  const disableSearchStage =
    isReadonlyView &&
    (!pipelineIsSearchQueryable ||
      versionIncompatibleCompass ||
      versionIncompatibleDE);

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
            versionIncompatibleDE,
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
